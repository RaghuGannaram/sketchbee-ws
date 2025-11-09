import { Types } from "mongoose";
import UserModel, { type UserDocument } from "@src/models/User.model";
import { DataError, DataErrors, catchAsyncDataError, processMongoError } from "@src/utils/application-errors";
import type { IUser, IUserUpdate } from "@src/types";
import logger from "@src/configs/logger.config";

const isValidObjectId = (id: string) => Types.ObjectId.isValid(id);

const getAllUserRecords = catchAsyncDataError(async function (): Promise<IUser[]> {
    logger.debug(`user.data: reading all user records`);

    let userDocs: UserDocument[] = [];
    try {
        userDocs = await UserModel.find().select("-email -password -role");
    } catch (error) {
        processMongoError(error);
    }

    return userDocs.map((userDoc) => userDoc.toObject());
});

const getUserRecordByID = catchAsyncDataError(async function (userId: string) {
    logger.debug(`user.data: reading user record for user: %s`, userId);

    if (!isValidObjectId(userId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid userId.");

    let userDoc: UserDocument | null = null;

    try {
        userDoc = await UserModel.findById(userId)
            .select("-email -password -role")
            .populate({
                path: "followers",
                select: "id fullname handle avatar",
            })
            .populate({
                path: "followees",
                select: "id fullname handle avatar",
            });
    } catch (error) {
        processMongoError(error);
    }
    if (!userDoc) throw new DataError(DataErrors.DB_RECORD_NOT_FOUND, "user not found.");

    return userDoc.toObject() as IUser & {
        followers: Pick<IUser, "id" | "fullname" | "handle" | "avatar">[];
        followees: Pick<IUser, "id" | "fullname" | "handle" | "avatar">[];
    };
});

const updateUserRecord = catchAsyncDataError(async function (
    userId: string,
    updateData: IUserUpdate | { [key in "avatar" | "background"]: string }
): Promise<IUser> {
    logger.debug(`user.data: updating user record for user: %s`, userId);

    if (!isValidObjectId(userId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid userId.");

    let updatedUserDoc: UserDocument | null = null;
    try {
        updatedUserDoc = await UserModel.findByIdAndUpdate(userId, { $set: updateData }, { new: true })
            .select("-email -password -role")
            .populate({
                path: "followers",
                select: "id fullname handle avatar",
            })
            .populate({
                path: "followees",
                select: "id fullname handle avatar",
            });
    } catch (error) {
        processMongoError(error);
    }
    if (!updatedUserDoc) throw new DataError(DataErrors.DB_RECORD_NOT_FOUND, "user not found.");

    return updatedUserDoc.toObject() as IUser & {
        followers: Pick<IUser, "id" | "fullname" | "handle" | "avatar">[];
        followees: Pick<IUser, "id" | "fullname" | "handle" | "avatar">[];
    };
});

const updateUserFollowRecord = catchAsyncDataError(async function (
    followerId: string,
    followeeId: string
): Promise<string> {
    logger.debug(`user.data: updating follow record for user: %s`, followerId);

    if (!isValidObjectId(followerId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid followerId.");
    if (!isValidObjectId(followeeId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid followeeId.");

    let followerDoc: UserDocument | null = null;
    let followeeDoc: UserDocument | null = null;

    try {
        followerDoc = await UserModel.findById(followerId);
        followeeDoc = await UserModel.findById(followeeId);
    } catch (error) {
        processMongoError(error);
    }

    if (!followerDoc) throw new DataError(DataErrors.DB_RECORD_NOT_FOUND, "follower not found (User not found).");
    if (!followeeDoc)
        throw new DataError(DataErrors.DB_RECORD_NOT_FOUND, "followed not found (Can't follow non-existent user).");

    if (!followeeDoc.followers.some((id) => id.equals(followerDoc.id))) {
        await followeeDoc.updateOne({ $push: { followers: followerDoc.id } });
        await followerDoc.updateOne({ $push: { followees: followeeDoc.id } });
        return `you started followee ${followeeDoc.handle}.`;
    } else {
        await followeeDoc.updateOne({ $pull: { followers: followerDoc.id } });
        await followerDoc.updateOne({ $pull: { followees: followeeDoc.id } });
        return `you just unfollowed ${followeeDoc.handle}.`;
    }
});

const deleteUserRecord = catchAsyncDataError(async function (userId: string): Promise<void> {
    logger.debug(`user.data: deleting user record for user: %s`, userId);

    if (!isValidObjectId(userId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid userId.");

    try {
        await UserModel.findByIdAndDelete(userId);
    } catch (error) {
        processMongoError(error);
    }

    return;
});

export default { getAllUserRecords, getUserRecordByID, updateUserRecord, updateUserFollowRecord, deleteUserRecord };
