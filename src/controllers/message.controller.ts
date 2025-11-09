import type { Request, Response } from "express";
import messageBusinessService from "@src/services/message.business";
import catchAsyncError from "@src/middlewares/catch-async-error.middleware";
import type { IController, IVerifiedRequest } from "@src/types";
import { HttpError, HttpErrors } from "@src/utils/application-errors";

const fetchMessages: IController = catchAsyncError(async function (req: Request, res: Response) {
    const { chatId } = req.params;

    if (!chatId) throw new HttpError(400, HttpErrors.BAD_REQUEST, "chatId is required.");

    const messages = await messageBusinessService.fetchMessages(chatId);

    res.json({
        messages: messages,
    });
});

const sendMessage: IController = catchAsyncError(async function (req: Request, res: Response) {
    const { chatId, content } = req.body;

    if (!chatId || !content)
        throw new HttpError(400, HttpErrors.BAD_REQUEST, "chatId, sender, and content are required.");

    const newMessage = {
        chat: chatId,
        content: content,
    };
    
    const authUser = (req as IVerifiedRequest).user;
    const message = await messageBusinessService.sendMessage(authUser, newMessage);

    res.json({
        message: message,
    });
});

export default { fetchMessages, sendMessage };
