import type { Request, Response } from "express";
import userBusinessService from "@src/services/user.business";
import catchAsyncError from "@src/middlewares/catch-async-error.middleware";
import type { IController, IVerifiedRequest } from "@src/types";
import { HttpError, HttpErrors } from "@src/utils/application-errors";

const getAllUsers: IController = catchAsyncError(async function (_req: Request, res: Response) {
    const users = await userBusinessService.getAllUsers();

    res.status(200).json({ users: users });
});

const getUserByID: IController = catchAsyncError(async function (req: Request, res: Response) {
    const { userId } = req.params;
    if (!userId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "userId not provided.");

    const user = await userBusinessService.getUserByID(userId);

    res.status(200).json({ user: user });
});

const updateUserInfo: IController = catchAsyncError(async function (req: Request, res: Response) {
    const { userId } = req.body;
    if (!userId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "userId not provided.");

    const { fullname, bio, city, from } = req.body;
    if ([fullname, bio, city, from].some((field) => field === undefined))
        throw new HttpError(400, HttpErrors.BAD_REQUEST, "fullname, bio, city, from are required.");

    const updateData: any = {
        fullname,
        bio,
        city,
        from,
    };

    const authUser = (req as IVerifiedRequest).user;
    const updatedUser = await userBusinessService.updateUserInfo(authUser, userId, updateData);

    res.status(200).json({ user: updatedUser });
});

const updateUserImage: IController = catchAsyncError(async (req: Request, res: Response) => {
    const { userId } = req.body;

    if (!userId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "userId not provided.");
    if (!req.body.type || !["avatar", "background"].includes(req.body.type))
        throw new HttpError(400, HttpErrors.BAD_REQUEST, "invalid type.");
    if (!req.file) throw new HttpError(400, HttpErrors.BAD_REQUEST, "file not provided.");

    const authUser = (req as IVerifiedRequest).user;

    const updateData: any = {
        type: req.body.type,
        file: req.file as Express.Multer.File,
    };

    const updatedUser = await userBusinessService.updateUserImage(authUser, userId, updateData);

    res.status(200).json({ user: updatedUser });
});

const followUser: IController = catchAsyncError(async function (req: Request, res: Response) {
    const { followeeId } = req.body;
    if (!followeeId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "followeeId not provided.");

    const authUser = (req as IVerifiedRequest).user;
    const response = await userBusinessService.followUser(authUser, followeeId);

    res.status(200).json({ message: response });
});

const deleteUser: IController = catchAsyncError(async function (req: Request, res: Response) {
    const { userId } = req.body;
    if (!userId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "userId not provided.");

    const authUser = (req as IVerifiedRequest).user;
    await userBusinessService.deleteUser(authUser, userId);

    res.status(200).json({ message: "user deleted successfully." });
});

export default {
    getAllUsers,
    getUserByID,
    updateUserInfo,
    updateUserImage,
    followUser,
    deleteUser,
};
