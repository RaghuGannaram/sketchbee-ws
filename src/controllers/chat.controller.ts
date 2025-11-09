import type { Request, Response } from "express";
import chatBusinessService from "@src/services/chat.business";
import catchAsyncError from "@src/middlewares/catch-async-error.middleware";
import type { IController, IVerifiedRequest } from "@src/types";
import { HttpError, HttpErrors } from "@src/utils/application-errors";

const getAllChats: IController = catchAsyncError(async function (req: Request, res: Response) {
    const authUser = (req as IVerifiedRequest).user;
    const chats = await chatBusinessService.getAllChats(authUser);

    res.json({
        chats: chats,
    });
});

const getPrivateChats: IController = catchAsyncError(async function (req: Request, res: Response) {
    const authUser = (req as IVerifiedRequest).user;
    const chats = await chatBusinessService.getPrivateChats(authUser);

    res.json({
        chats: chats,
    });
});

const getGroupChats: IController = catchAsyncError(async function (req: Request, res: Response) {
    const authUser = (req as IVerifiedRequest).user;
    const chats = await chatBusinessService.getGroupChats(authUser);

    res.json({
        chats: chats,
    });
});

const getChatMembers: IController = catchAsyncError(async function (req: Request, res: Response) {
    const { chatId } = req.params;

    if (!chatId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "chatId is required.");

    const members = await chatBusinessService.getChatMembers(chatId as string);

    res.json({
        members: members,
    });
});

const createChat: IController = catchAsyncError(async function (req: Request, res: Response) {
    const { participantId } = req.body;

    if (!participantId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "participantId is required.");

    const authUser = (req as IVerifiedRequest).user;
    const chat = await chatBusinessService.createChat(authUser, participantId);

    res.json({
        chat: chat,
    });
});

const createGroupChat: IController = catchAsyncError(async function (req: Request, res: Response) {
    const { groupName, participantList } = req.body;

    if (!groupName || !participantList)
        throw new HttpError(400, HttpErrors.BAD_REQUEST, "groupName, participantList are required.");

    const authUser = (req as IVerifiedRequest).user;
    const chat = await chatBusinessService.createGroupChat(authUser, groupName, participantList);

    res.json({
        chat: chat,
    });
});

const joinGroup: IController = catchAsyncError(async function (req: Request, res: Response) {
    const { chatId, participantId } = req.body;

    if (!chatId || !participantId)
        throw new HttpError(400, HttpErrors.BAD_REQUEST, "participantId and chatId are required.");

    const authUser = (req as IVerifiedRequest).user;
    const chat = await chatBusinessService.joinGroup(authUser, chatId, participantId);

    res.json({
        chat: chat,
    });
});

const leaveGroup: IController = catchAsyncError(async function (req: Request, res: Response) {
    const { chatId, participantId } = req.body;

    if (!chatId || !participantId)
        throw new HttpError(400, HttpErrors.BAD_REQUEST, "participantId and chatId are required.");

    const authUser = (req as IVerifiedRequest).user;
    const chat = await chatBusinessService.leaveGroup(authUser, chatId, participantId);

    res.json({
        chat: chat,
    });
});

const deleteChat: IController = catchAsyncError(async function (req: Request, res: Response) {
    const { chatId } = req.params;

    if (!chatId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "chatId is required.");

    const authUser = (req as IVerifiedRequest).user;
    await chatBusinessService.deleteChat(authUser, chatId);

    res.json({
        message: "chat deleted successfully.",
    });
});

const deleteGroupChat: IController = catchAsyncError(async function (req: Request, res: Response) {
    const { chatId } = req.params;

    if (!chatId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "chatId is required.");

    const authUser = (req as IVerifiedRequest).user;
    await chatBusinessService.deleteGroupChat(authUser, chatId);

    res.json({
        message: "group chat deleted successfully.",
    });
});

export default {
    getAllChats,
    getPrivateChats,
    getGroupChats,
    getChatMembers,
    createChat,
    createGroupChat,
    joinGroup,
    leaveGroup,
    deleteChat,
    deleteGroupChat,
};
