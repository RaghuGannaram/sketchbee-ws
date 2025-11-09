import mongoose from "mongoose";
import CommentModel, { type CommentDocument } from "@src/models/Comment.model";
import { DataError, DataErrors, catchAsyncDataError, processMongoError } from "@src/utils/application-errors";
import type { IComment, IUser } from "@src/types";
import logger from "@src/configs/logger.config";

const isValidObjectId = (id: string) => mongoose.Types.ObjectId.isValid(id);

const getAllCommentRecords = catchAsyncDataError(async function () {
    logger.debug(`comment.data: reading all comment records`);

    let commentDocs: CommentDocument[] = [];

    try {
        commentDocs = await CommentModel.find().populate({
            path: "author",
            select: "id fullname handle avatar",
        });
    } catch (error) {
        processMongoError(error);
    }

    return commentDocs.map(
        (commentDoc) =>
            commentDoc.toObject() as IComment & { author: Pick<IUser, "id" | "fullname" | "handle" | "avatar"> }
    );
});

const getUserCommentRecords = catchAsyncDataError(async function (userId: string) {
    logger.debug(`comment.data: reading all comment records of user: %s`, userId);

    if (!isValidObjectId(userId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid userId.");

    let commentDocs: CommentDocument[] = [];

    try {
        commentDocs = await CommentModel.find({ author: userId }).populate({
            path: "author",
            select: "id fullname handle avatar",
        });
    } catch (error) {
        processMongoError(error);
    }

    return commentDocs.map(
        (commentDoc) =>
            commentDoc.toObject() as IComment & { author: Pick<IUser, "id" | "fullname" | "handle" | "avatar"> }
    );
});

const getPostCommentRecords = catchAsyncDataError(async function (postId: string) {
    logger.debug(`comment.data: reading all comment records of post: %s`, postId);

    if (!isValidObjectId(postId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid postId.");

    let commentDocs: CommentDocument[] = [];

    try {
        commentDocs = await CommentModel.find({ post: postId }).populate({
            path: "author",
            select: "id fullname handle avatar",
        });
    } catch (error) {
        processMongoError(error);
    }

    return commentDocs.map(
        (commentDoc) =>
            commentDoc.toObject() as IComment & { author: Pick<IUser, "id" | "fullname" | "handle" | "avatar"> }
    );
});

const getCommentRecordByID = catchAsyncDataError(async function (commentId: string) {
    logger.debug(`comment.data: reading comment record: %s`, commentId);

    if (!isValidObjectId(commentId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid commentId.");

    let commentDoc: CommentDocument | null = null;

    try {
        commentDoc = await CommentModel.findById(commentId).populate({
            path: "author",
            select: "id fullname handle avatar",
        });
    } catch (error) {
        processMongoError(error);
    }

    if (!commentDoc) throw new DataError(DataErrors.DB_RECORD_NOT_FOUND, "comment not found.");

    return commentDoc.toObject() as IComment & { author: Pick<IUser, "id" | "fullname" | "handle" | "avatar"> };
});

const addCommentRecord = catchAsyncDataError(async function (
    comment: Pick<IComment, "author" | "post" | "description">
) {
    logger.debug(`comment.data: creating comment record %o`, comment);

    let commentDoc: CommentDocument | null = null;

    try {
        const newCommentInstance = new CommentModel(comment);
        commentDoc = await newCommentInstance.save();
    } catch (error) {
        processMongoError(error);
    }

    if (!commentDoc) throw new DataError(DataErrors.DB_WRITE_OPERATION_FAILED, "comment creation failed.");

    const createdCommentDoc = await CommentModel.findById(commentDoc._id).populate({
        path: "author",
        select: "id fullname handle avatar",
    });

    if (!createdCommentDoc) throw new DataError(DataErrors.DB_WRITE_OPERATION_FAILED, "comment creation failed.");

    return createdCommentDoc.toObject() as IComment & { author: Pick<IUser, "id" | "fullname" | "handle" | "avatar"> };
});

const updateCommentRecord = catchAsyncDataError(async function (
    commentId: string,
    updatedData: Pick<IComment, "description">
) {
    logger.debug(`comment.data: updating comment record %s with: %o`, commentId, updatedData);

    if (!isValidObjectId(commentId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid commentId");

    let updatedCommentDoc: CommentDocument | null = null;

    try {
        updatedCommentDoc = await CommentModel.findByIdAndUpdate(
            commentId,
            { $set: { ...updatedData } },
            { new: true }
        ).populate({
            path: "author",
            select: "id fullname handle avatar",
        });
    } catch (error) {
        processMongoError(error);
    }

    if (!updatedCommentDoc) throw new DataError(DataErrors.DB_RECORD_NOT_FOUND, "comment not found");

    return updatedCommentDoc.toObject() as IComment & { author: Pick<IUser, "id" | "fullname" | "handle" | "avatar"> };
});

const pushLikeIntoCommentRecord = catchAsyncDataError(async function (
    commentId: string,
    userId: string
): Promise<string> {
    logger.debug(`comment.data: adding %s user's like to comment record %s`, userId, commentId);

    if (!isValidObjectId(userId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid userId");
    if (!isValidObjectId(commentId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid commentId");

    try {
        await CommentModel.findByIdAndUpdate(commentId, { $push: { likes: userId } });
    } catch (error) {
        processMongoError(error);
    }

    return `like added to comment ${commentId}.`;
});

const pullLikeFromCommentRecord = catchAsyncDataError(async function (
    commentId: string,
    userId: string
): Promise<string> {
    logger.debug(`comment.data: removing %s user's like from comment records %s `, userId, commentId);

    if (!isValidObjectId(userId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid userId");
    if (!isValidObjectId(commentId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid commentId");

    try {
        await CommentModel.findByIdAndUpdate(commentId, { $pull: { likes: userId } });
    } catch (error) {
        processMongoError(error);
    }

    return `like removed from comment ${commentId}.`;
});

const deleteCommentRecord = catchAsyncDataError(async function (commentId: string): Promise<string> {
    logger.debug(`comment.data: deleting comment record: %s`, commentId);

    try {
        await CommentModel.findByIdAndDelete(commentId);
    } catch (error) {
        processMongoError(error);
    }

    return `comment ${commentId} deletion successful.`;
});

const deleteUserCommentRecords = catchAsyncDataError(async function (userId: string): Promise<void> {
    logger.debug(`comment.data: deleting all comment records of user: %s`, userId);

    if (!isValidObjectId(userId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid userId.");

    try {
        await CommentModel.deleteMany({ author: userId });
    } catch (error) {
        processMongoError(error);
    }
});

const deletePostCommentRecords = catchAsyncDataError(async function (postId: string): Promise<void> {
    logger.debug(`comment.data: deleting all comment records of post: %s`, postId);

    if (!isValidObjectId(postId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid postId.");

    try {
        await CommentModel.deleteMany({ post: postId });
    } catch (error) {
        processMongoError(error);
    }
});

export default {
    getAllCommentRecords,
    getUserCommentRecords,
    getPostCommentRecords,
    getCommentRecordByID,
    addCommentRecord,
    updateCommentRecord,
    pushLikeIntoCommentRecord,
    pullLikeFromCommentRecord,
    deleteCommentRecord,
    deleteUserCommentRecords,
    deletePostCommentRecords,
};
