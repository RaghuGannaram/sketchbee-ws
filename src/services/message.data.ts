import MessageModel, { type MessageDocument } from "@src/models/Message.model";
import { DataError, DataErrors, processMongoError, catchAsyncDataError } from "@src/utils/application-errors";
import logger from "@src/configs/logger.config";

const getMessageRecords = catchAsyncDataError(async function (chatId: string): Promise<any> {
    logger.debug(`message.data: reading messages for chat: %o`, chatId);

    let messageDocs: MessageDocument[] = [];

    try {
        messageDocs = await MessageModel.find({ chat: chatId }).populate({
            path: "sender",
            select: "fullname handle",
        });
    } catch (error) {
        processMongoError(error);
    }

    if (!messageDocs) throw new DataError(DataErrors.DB_RECORD_NOT_FOUND, "messages not found.");

    return messageDocs.map((messageDoc) => messageDoc.toObject());
});

const addMessageRecord = catchAsyncDataError(async function (newMessage: any): Promise<any> {
    logger.debug(`message.data: adding message: %o`, newMessage);

    let newMessageDoc: MessageDocument | null = null;

    try {
        const newMessageInstance = new MessageModel(newMessage);
        newMessageDoc = await newMessageInstance.save();
    } catch (error) {
        processMongoError(error);
    }

    if (!newMessageDoc) throw new DataError(DataErrors.DB_WRITE_OPERATION_FAILED, "message creation failed.");

    const createdChatDoc = await MessageModel.findById(newMessageDoc.id).populate({
        path: "sender",
        select: "fullname handle",
    });

    if (!createdChatDoc) throw new DataError(DataErrors.DB_WRITE_OPERATION_FAILED, "message creation failed.");

    return createdChatDoc.toObject();
});

export default { getMessageRecords, addMessageRecord };
