import messageDataService from "@src/services/message.data";
import chatDataService from "@src/services/chat.data";
import { catchAsyncBusinessError } from "@src/utils/application-errors";
import logger from "@src/configs/logger.config";
import type { IAuthUser } from "@src/types";

const fetchMessages = catchAsyncBusinessError(async function (chatId: string) {
    logger.info(`message.business: fetching messages for chat: %s`, chatId);

    const messages = await messageDataService.getMessageRecords(chatId);

    return messages;
});

const sendMessage = catchAsyncBusinessError(async function (authUser: IAuthUser, newMessage: any) {
    logger.info(`message.business: sending message: %o`, newMessage);

    newMessage.sender = authUser.id;

    const message = await messageDataService.addMessageRecord(newMessage);

    await chatDataService.updateChatRecord(message.chat, { lastMessage: message.id });

    return message;
});

export default { fetchMessages, sendMessage };
