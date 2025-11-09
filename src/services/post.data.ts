import mongoose from "mongoose";
import PostModel, { type PostDocument } from "@src/models/Post.model";
import { DataError, DataErrors, catchAsyncDataError, processMongoError } from "@src/utils/application-errors";
import type { IPost, IUser } from "@src/types";
import logger from "@src/configs/logger.config";

const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

const getAllPostRecords = catchAsyncDataError(async function () {
    logger.debug(`post.data: reading all post records`);

    let postDocs: PostDocument[] = [];

    try {
        postDocs = await PostModel.find().select("-comments").populate({
            path: "author",
            select: "id fullname handle avatar",
        });
    } catch (error) {
        processMongoError(error);
    }

    return postDocs.map(
        (postDoc) => postDoc.toObject() as IPost & { author: Pick<IUser, "id" | "fullname" | "handle" | "avatar"> }
    );
});

const getAllPostRecordsByUser = catchAsyncDataError(async function (userId: string) {
    logger.debug(`post.data: reading all post records of user: %s`, userId);

    if (!isValidObjectId(userId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid userId.");

    let postDocs: PostDocument[] = [];

    try {
        postDocs = await PostModel.find({ author: userId }).populate({
            path: "author",
            select: "id fullname handle avatar",
        });
    } catch (error) {
        processMongoError(error);
    }

    return postDocs.map(
        (postDoc) => postDoc.toObject() as IPost & { author: Pick<IUser, "id" | "fullname" | "handle" | "avatar"> }
    );
});

const getPostRecordByID = catchAsyncDataError(async function (postId: string) {
    logger.debug(`post.data: reading post record: %s`, postId);

    if (!isValidObjectId(postId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid postId");

    let postDoc: PostDocument | null = null;

    try {
        postDoc = await PostModel.findById(postId).populate({
            path: "author",
            select: "id fullname handle avatar",
        });
    } catch (error) {
        processMongoError(error);
    }
    if (!postDoc) throw new DataError(DataErrors.DB_RECORD_NOT_FOUND, "post not found");

    return postDoc.toObject() as IPost & { author: Pick<IUser, "id" | "fullname" | "handle" | "avatar"> };
});

const getAllPostRecordsByUserFollowees = catchAsyncDataError(async function (followeeList: string[]) {
    logger.debug(`post.data: reading all post records of followees`);

    let postDocs: PostDocument[] = [];

    try {
        postDocs = await PostModel.find({ author: { $in: followeeList } });
    } catch (error) {
        processMongoError(error);
    }

    return postDocs.map(
        (postDoc) => postDoc.toObject() as IPost & { author: Pick<IUser, "id" | "fullname" | "handle" | "avatar"> }
    );
});

const createNewPostRecord = catchAsyncDataError(async function (post: Partial<IPost>) {
    logger.debug(`post.data: creating new post record %o`, post);

    let postDoc: PostDocument | null = null;

    try {
        const newPostInstance = await PostModel.create(post);
        postDoc = await newPostInstance.save();
    } catch (error) {
        processMongoError(error);
    }

    if (!postDoc) throw new DataError(DataErrors.DB_WRITE_OPERATION_FAILED, "post record creation failed.");

    const createdPostDoc = await PostModel.findById(postDoc._id).populate({
        path: "author",
        select: "id fullname handle avatar",
    });

    if (!createdPostDoc) throw new DataError(DataErrors.DB_WRITE_OPERATION_FAILED, "post record creation failed.");

    return createdPostDoc.toObject() as IPost & { author: Pick<IUser, "id" | "fullname" | "handle" | "avatar"> };
});

const updatePostRecord = catchAsyncDataError(async function (postId: string, updatedData: Partial<IPost>) {
    logger.debug(`post.data: updating post record: %s with %o`, postId, updatedData);

    if (!isValidObjectId(postId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid postId");

    let updatedPostDoc: PostDocument | null = null;
    try {
        updatedPostDoc = await PostModel.findByIdAndUpdate(
            postId,
            { $set: { ...updatedData } },
            { new: true }
        ).populate({
            path: "author",
            select: "id fullname handle avatar",
        });
    } catch (error) {
        processMongoError(error);
    }

    if (!updatedPostDoc) throw new DataError(DataErrors.DB_RECORD_NOT_FOUND, "post not found");

    return updatedPostDoc.toObject() as IPost & { author: Pick<IUser, "id" | "fullname" | "handle" | "avatar"> };
});

const pushLikeIntoPostRecord = catchAsyncDataError(async function (postId: string, userId: string): Promise<string> {
    logger.debug(`post.data: adding %s user's like to post record: %s`, userId, postId);

    if (!isValidObjectId(postId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid postId.");

    try {
        await PostModel.findByIdAndUpdate(postId, { $push: { likes: userId } });
    } catch (error) {
        processMongoError(error);
    }

    return `like added to post ${postId}.`;
});

const pullLikeFromPostRecord = catchAsyncDataError(async function (postId: string, userId: string): Promise<string> {
    logger.debug(`post.data: removing %s user's like from post record: %s`, userId, postId);

    if (!isValidObjectId(postId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid postId.");

    try {
        await PostModel.findByIdAndUpdate(postId, { $pull: { likes: userId } });
    } catch (error) {
        processMongoError(error);
    }

    return `like removed from post ${postId}.`;
});

const deletePostRecord = catchAsyncDataError(async function (postId: string): Promise<string> {
    logger.debug(`post.data: deleting post record: %s`, postId);

    if (!isValidObjectId(postId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid postId");

    try {
        await PostModel.findByIdAndDelete(postId);
    } catch (error) {
        processMongoError(error);
    }

    return `post ${postId} deletion successful.`;
});

const deleteUserPostRecords = catchAsyncDataError(async function (userId: string): Promise<void> {
    logger.debug(`post.data: deleting all post records of user: %s`, userId);

    if (!isValidObjectId(userId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid userId.");

    try {
        await PostModel.deleteMany({ author: userId });
    } catch (error) {
        processMongoError(error);
    }

    return;
});

export default {
    getAllPostRecords,
    getAllPostRecordsByUser,
    getAllPostRecordsByUserFollowees,
    getPostRecordByID,
    createNewPostRecord,
    updatePostRecord,
    pushLikeIntoPostRecord,
    pullLikeFromPostRecord,
    deletePostRecord,
    deleteUserPostRecords,
};
