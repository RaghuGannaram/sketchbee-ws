import commentDataService from "@src/services/comment.data";
import awsDataService from "@src/services/aws.data";
import { BusinessError, BusinessErrors, catchAsyncBusinessError } from "@src/utils/application-errors";
import type { IAuthUser } from "@src/types";
import logger from "@src/configs/logger.config";

const getAllComments = catchAsyncBusinessError(async function () {
    logger.info(`comment.business: getting all comments`);

    const comments = await commentDataService.getAllCommentRecords();

    const processedComments = await Promise.all(
        comments.map(async (comment) => {
            comment.author.avatar = await awsDataService.getFile(comment.author.avatar);
            return comment;
        })
    );

    return processedComments;
});

const getUserComments = catchAsyncBusinessError(async function (userId: string) {
    logger.info(`comment.business: getting %s user's comments`, userId);

    const comments = await commentDataService.getUserCommentRecords(userId);

    const processedComments = await Promise.all(
        comments.map(async (comment) => {
            comment.author.avatar = await awsDataService.getFile(comment.author.avatar);
            return comment;
        })
    );

    return processedComments;
});

const getPostComments = catchAsyncBusinessError(async function (postId: string) {
    logger.info(`comment.business: getting %s post's comments`, postId);

    const comments = await commentDataService.getPostCommentRecords(postId);

    const processedComments = await Promise.all(
        comments.map(async (comment) => {
            comment.author.avatar = await awsDataService.getFile(comment.author.avatar);
            return comment;
        })
    );

    return processedComments;
});

const addComment = catchAsyncBusinessError(async function (
    authUser: IAuthUser,
    postId: string,
    commentData: {
        description: string;
    }
) {
    logger.info(`comment.business: adding comment %o to post: %s by user %s`, commentData, postId, authUser.id);

    const comment = {
        author: authUser.id,
        post: postId,
        ...commentData,
    };

    const newComment = await commentDataService.addCommentRecord(comment);

    newComment.author.avatar = await awsDataService.getFile(newComment.author.avatar);

    return newComment;
});

const updateComment = catchAsyncBusinessError(async function (
    authUser: IAuthUser,
    commentId: string,
    updatedData: {
        description: string;
    }
) {
    logger.info(`comment.business: updating comment %s with %o by user %s`, commentId, updatedData, authUser.id);

    const comment = await commentDataService.getCommentRecordByID(commentId);

    if (authUser.role !== "admin" && authUser.id !== comment.author.id)
        throw new BusinessError(BusinessErrors.UNAUTHORIZED_ACCESS, "you can only update your own comment.");

    const updatedComment = await commentDataService.updateCommentRecord(commentId, updatedData);

    updatedComment.author.avatar = await awsDataService.getFile(updatedComment.author.avatar);

    return updatedComment;
});

const likeComment = catchAsyncBusinessError(async function (authUser: IAuthUser, commentId: string) {
    logger.info(`comment.business: adding like to comment: %s by user: %s`, commentId, authUser.id);

    const comment = await commentDataService.getCommentRecordByID(commentId);

    const alreadyLiked = comment.likes.some((like) => like.toString() === authUser.id);

    let response = null;

    if (alreadyLiked) {
        response = await commentDataService.pullLikeFromCommentRecord(commentId, authUser.id);
    } else {
        response = await commentDataService.pushLikeIntoCommentRecord(commentId, authUser.id);
    }

    return response;
});

const deleteComment = catchAsyncBusinessError(async function (authUser: IAuthUser, commentId: string) {
    logger.info(`comment.business: deleting comment %s by user %s`, commentId, authUser.id);

    const comment = await commentDataService.getCommentRecordByID(commentId);

    if (authUser.role !== "admin" && authUser.id !== comment.author.id)
        throw new BusinessError(BusinessErrors.UNAUTHORIZED_ACCESS, "you can only delete your own comment.");

    const response = await commentDataService.deleteCommentRecord(commentId);

    return response;
});

export default {
    getAllComments,
    getUserComments,
    getPostComments,
    addComment,
    updateComment,
    deleteComment,
    likeComment,
};
