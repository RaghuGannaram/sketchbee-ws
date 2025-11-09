import postDataService from "@src/services/post.data";
import userDataService from "@src/services/user.data";
import commentDataService from "@src/services/comment.data";
import awsDataService from "@src/services/aws.data";
import imageDataService from "@src/services/image.data";
import constants from "@src/constants";
import { BusinessError, BusinessErrors, catchAsyncBusinessError } from "@src/utils/application-errors";
import type { IAuthUser, IPost, IPostCreate, IPostUpdate } from "@src/types";
import logger from "@src/configs/logger.config";

const getAllPosts = catchAsyncBusinessError(async function () {
    logger.info(`post.business: getting all posts`);

    const posts = await postDataService.getAllPostRecords();

    const processedPosts = await Promise.all(
        posts.map(async (post) => {
            post.author.avatar = await awsDataService.getFile(post.author.avatar);
            if (post.image.thumbnail) post.image.thumbnail = await awsDataService.getFile(post.image.thumbnail);
            if (post.image.original) post.image.original = await awsDataService.getFile(post.image.original);
            return post;
        })
    );

    return processedPosts;
});

const getUserPosts = catchAsyncBusinessError(async function (userId: string) {
    logger.info(`post.business: getting personal posts of user: %s`, userId);

    const posts = await postDataService.getAllPostRecordsByUser(userId);

    const processedPosts = await Promise.all(
        posts.map(async (post) => {
            post.author.avatar = await awsDataService.getFile(post.author.avatar);
            if (post.image.thumbnail) post.image.thumbnail = await awsDataService.getFile(post.image.thumbnail);
            if (post.image.original) post.image.original = await awsDataService.getFile(post.image.original);
            return post;
        })
    );

    return processedPosts;
});

const getPost = catchAsyncBusinessError(async function (postId: string) {
    logger.info(`post.business: getting post details of post: %s`, postId);

    const post = await postDataService.getPostRecordByID(postId);

    post.author.avatar = await awsDataService.getFile(post.author.avatar);
    if (post.image.thumbnail) post.image.thumbnail = await awsDataService.getFile(post.image.thumbnail);
    if (post.image.original) post.image.original = await awsDataService.getFile(post.image.original);

    return post;
});

const getTimelinePosts = catchAsyncBusinessError(async function (authUser: IAuthUser) {
    logger.info(`post.business: getting timeline posts of user: %s`, authUser.id);

    const userPosts = await postDataService.getAllPostRecordsByUser(authUser.id);
    const user = await userDataService.getUserRecordByID(authUser.id);
    const followeesPosts = await postDataService.getAllPostRecordsByUserFollowees(
        user.followees.map((followee) => followee.id)
    );

    const posts = [...userPosts, ...followeesPosts];

    const processedPosts = await Promise.all(
        posts.map(async (post) => {
            post.author.avatar = await awsDataService.getFile(post.author.avatar);
            if (post.image.thumbnail) post.image.thumbnail = await awsDataService.getFile(post.image.thumbnail);
            if (post.image.original) post.image.original = await awsDataService.getFile(post.image.original);
            return post;
        })
    );

    return processedPosts;
});

const addPost = catchAsyncBusinessError(async function (authUser: IAuthUser, post: IPostCreate) {
    logger.info(`post.business: adding new post %o by user: %s`, post, authUser.id);

    const newPost: Partial<IPost> = {
        author: authUser.id,
        description: post.description,
    };

    if (typeof post.image !== "string") {
        const processedThumbnailBuffer = await imageDataService.processImage(post.image.buffer, {
            size: constants.POST_IMAGE_THUMBNAIL_SIZE,
        });
        const processedOriginalBuffer = await imageDataService.processImage(post.image.buffer, {
            size: constants.POST_IMAGE_ORIGINAL_SIZE,
        });

        const [thumbnail, original] = await Promise.all([
            awsDataService.uploadFile(
                `${authUser.id}_postAttachment_thumbnail_${Date.now()}`,
                processedThumbnailBuffer
            ),
            awsDataService.uploadFile(`${authUser.id}_postAttachment_original_${Date.now()}`, processedOriginalBuffer),
        ]);

        newPost.image = {
            thumbnail: thumbnail,
            original: original,
        };
    }

    const savedPost = await postDataService.createNewPostRecord(newPost);

    savedPost.author.avatar = await awsDataService.getFile(savedPost.author.avatar);
    if (savedPost.image.thumbnail) savedPost.image.thumbnail = await awsDataService.getFile(savedPost.image.thumbnail);
    if (savedPost.image.original) savedPost.image.original = await awsDataService.getFile(savedPost.image.original);

    return savedPost;
});

const updatePost = catchAsyncBusinessError(async function (
    authUser: IAuthUser,
    postId: string,
    updatedData: IPostUpdate
) {
    logger.info(`post.business: updating post %s with %o by user: %s`, postId, updatedData, authUser.id);

    const post = await postDataService.getPostRecordByID(postId);

    if (authUser.role !== "admin" && authUser.id !== post.author.id)
        throw new BusinessError(BusinessErrors.UNAUTHORIZED_ACCESS, "you can only update your own post.");

    let data: any = {
        description: updatedData.description,
    };

    if (updatedData.hasOwnProperty("image")) {
        post.image.thumbnail !== "" && (await awsDataService.deleteFile(post.image.thumbnail));
        post.image.original !== "" && (await awsDataService.deleteFile(post.image.original));

        data.image = {
            thumbnail: "",
            original: "",
        };
    }

    if (updatedData.hasOwnProperty("file")) {
        const processedThumbnailBuffer = await imageDataService.processImage(updatedData.file.buffer, {
            size: constants.POST_IMAGE_THUMBNAIL_SIZE,
        });
        const processedImageBuffer = await imageDataService.processImage(updatedData.file.buffer, {
            size: constants.POST_IMAGE_ORIGINAL_SIZE,
        });
        const thumbnail = await awsDataService.uploadFile(
            `${authUser.id}_postAttachment_thumbnail_${Date.now()}`,
            processedThumbnailBuffer
        );
        const original = await awsDataService.uploadFile(
            `${authUser.id}_postAttachment_original_${Date.now()}`,
            processedImageBuffer
        );

        post.image.thumbnail !== "" && (await awsDataService.deleteFile(post.image.thumbnail));
        post.image.original !== "" && (await awsDataService.deleteFile(post.image.original));

        data.image = {
            thumbnail: thumbnail,
            original: original,
        };
    }

    const updatedPost = await postDataService.updatePostRecord(postId, data);

    updatedPost.author.avatar = await awsDataService.getFile(updatedPost.author.avatar);

    if (updatedPost.image.thumbnail)
        updatedPost.image.thumbnail = await awsDataService.getFile(updatedPost.image.thumbnail);
    if (updatedPost.image.original)
        updatedPost.image.original = await awsDataService.getFile(updatedPost.image.original);

    return updatedPost;
});

const likePost = catchAsyncBusinessError(async function (authUser: IAuthUser, postId: string) {
    logger.info(`post.business: adding like to post: %s by user: %s`, postId, authUser.id);

    const post = await postDataService.getPostRecordByID(postId);

    let response = null;

    const alreadyLiked = post.likes.some((like) => like.toString() === authUser.id);

    if (alreadyLiked) {
        response = postDataService.pullLikeFromPostRecord(postId, authUser.id);
    } else {
        response = postDataService.pushLikeIntoPostRecord(postId, authUser.id);
    }

    return response;
});

const deletePost = catchAsyncBusinessError(async function (authUser: IAuthUser, postId: string) {
    logger.info(`post.business: deleting post %s by user: %s`, postId, authUser.id);

    const post = await postDataService.getPostRecordByID(postId);

    if (authUser.role !== "admin" && authUser.id !== post.author.id)
        throw new BusinessError(BusinessErrors.UNAUTHORIZED_ACCESS, "you can only delete your own post.");

    if (post.image.thumbnail !== "") await awsDataService.deleteFile(post.image.thumbnail);
    if (post.image.original !== "") await awsDataService.deleteFile(post.image.original);

    await postDataService.deletePostRecord(postId);
    await commentDataService.deletePostCommentRecords(postId);

    return `post ${postId} deletion successful.`;
});

export default {
    getAllPosts,
    getTimelinePosts,
    getUserPosts,
    getPost,
    addPost,
    updatePost,
    likePost,
    deletePost,
};
