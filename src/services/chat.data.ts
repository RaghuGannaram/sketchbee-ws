import { Types } from "mongoose";
import ChatModel, { type ChatDocument } from "@src/models/Chat.model";
import { processMongoError, catchAsyncDataError, DataError, DataErrors } from "@src/utils/application-errors";

const isValidObjectId = (id: string) => Types.ObjectId.isValid(id);

const getAllChatRecords = catchAsyncDataError(async function (participantId: String): Promise<any[]> {
    let chatDocs: ChatDocument[] = [];

    try {
        chatDocs = await ChatModel.find({ participants: { $in: [participantId] } }).populate({
            path: "participants",
            select: "fullname handle avatar",
        });
    } catch (error) {
        processMongoError(error);
    }

    return chatDocs.map((chatDoc) => chatDoc.toObject());
});

const getPersonalChatRecords = catchAsyncDataError(async function (participantId: string): Promise<any[]> {
    if (!isValidObjectId(participantId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid participantId.");
    let chatDocs: ChatDocument[] = [];

    try {
        chatDocs = await ChatModel.find({ participants: { $in: [participantId] }, isGroupChat: false });
    } catch (error) {
        processMongoError(error);
    }

    return chatDocs.map((chatDoc) => chatDoc.toObject());
});

const getGroupChatRecords = catchAsyncDataError(async function (participantId: string): Promise<any[]> {
    if (!isValidObjectId(participantId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid participantId.");

    let chatDocs: ChatDocument[] = [];

    try {
        chatDocs = await ChatModel.find({ participants: { $in: [participantId] }, isGroupChat: true });
    } catch (error) {
        processMongoError(error);
    }

    return chatDocs.map((chatDoc) => chatDoc.toObject());
});

const getParticipantsOfChatRecord = catchAsyncDataError(async function (chatId: string): Promise<any[]> {
    if (!isValidObjectId(chatId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid chatId.");

    let chatDoc: ChatDocument | null = null;

    try {
        chatDoc = await ChatModel.findById(chatId);
    } catch (error) {
        processMongoError(error);
    }

    if (!chatDoc) throw new DataError(DataErrors.DB_RECORD_NOT_FOUND, "chat not found.");

    return chatDoc.participants;
});

const createChatRecord = catchAsyncDataError(async function (participantList: string[]): Promise<any> {
    if (participantList.some((participantId) => !isValidObjectId(participantId)))
        throw new DataError(DataErrors.DB_INVALID_ID, "invalid participantId.");

    let chatDoc: ChatDocument | null = null;

    try {
        const newChatInstance = new ChatModel({
            participants: [...participantList],
            isGroupChat: false,
        });

        chatDoc = await newChatInstance.save();
    } catch (error) {
        processMongoError(error);
    }

    if (!chatDoc) throw new DataError(DataErrors.DB_WRITE_OPERATION_FAILED, "chat record creation failed.");

    const createdChatDoc = await ChatModel.findById(chatDoc.id).populate({
        path: "participants",
        select: "fullname handle avatar",
    });

    if (!createdChatDoc) throw new DataError(DataErrors.DB_WRITE_OPERATION_FAILED, "chat record creation failed.");

    return createdChatDoc.toObject();
});

const createGroupChatRecord = catchAsyncDataError(async function (
    groupName: string,
    participantList: string[]
): Promise<any> {
    if (participantList.some((participantId) => !isValidObjectId(participantId)))
        throw new DataError(DataErrors.DB_INVALID_ID, "invalid participantId.");

    let chatDoc: ChatDocument | null = null;

    try {
        const newChatInstance = new ChatModel({
            name: groupName,
            participants: [...participantList],
            isGroupChat: true,
        });

        chatDoc = await newChatInstance.save();
    } catch (error) {
        processMongoError(error);
    }

    if (!chatDoc) throw new DataError(DataErrors.DB_WRITE_OPERATION_FAILED, "group chat record creation failed.");

    return chatDoc.toObject();
});

const addParticipantRecord = catchAsyncDataError(async function (chatId: string, participantId: string): Promise<any> {
    if (!isValidObjectId(chatId) || !isValidObjectId(participantId))
        throw new DataError(DataErrors.DB_INVALID_ID, "invalid chatId or participantId.");

    let chatDoc: ChatDocument | null = null;

    try {
        chatDoc = await ChatModel.findByIdAndUpdate(chatId, { $push: { participants: participantId } }, { new: true });
    } catch (error) {
        processMongoError(error);
    }

    if (!chatDoc) throw new DataError(DataErrors.DB_WRITE_OPERATION_FAILED, "participant addition failed.");

    return chatDoc.toObject();
});

const removeParticipantRecord = catchAsyncDataError(async function (
    chatId: string,
    participantId: string
): Promise<any> {
    if (!isValidObjectId(chatId) || !isValidObjectId(participantId))
        throw new DataError(DataErrors.DB_INVALID_ID, "invalid chatId or participantId.");

    let chatDoc: ChatDocument | null = null;

    try {
        chatDoc = await ChatModel.findByIdAndUpdate(chatId, { $pull: { participants: participantId } }, { new: true });
    } catch (error) {
        processMongoError(error);
    }

    if (!chatDoc) throw new DataError(DataErrors.DB_WRITE_OPERATION_FAILED, "participant removal failed.");

    return chatDoc.toObject();
});

const updateChatRecord = catchAsyncDataError(async function (chatId: string, updateData: any): Promise<any> {
    if (!isValidObjectId(chatId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid chatId.");

    let chatDoc: ChatDocument | null = null;

    try {
        chatDoc = await ChatModel.findByIdAndUpdate(chatId, updateData, { new: true });
    } catch (error) {
        processMongoError(error);
    }

    if (!chatDoc) throw new DataError(DataErrors.DB_WRITE_OPERATION_FAILED, "update operation failed.");

    return chatDoc.toObject();
});

const deleteChatRecord = catchAsyncDataError(async function (chatId: string): Promise<any> {
    if (!isValidObjectId(chatId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid chatId.");

    try {
        await ChatModel.findByIdAndDelete(chatId);
    } catch (error) {
        processMongoError(error);
    }

    return;
});

const deleteGroupChatRecord = catchAsyncDataError(async function (chatId: string): Promise<any> {
    if (!isValidObjectId(chatId)) throw new DataError(DataErrors.DB_INVALID_ID, "invalid chatId.");

    try {
        await ChatModel.findByIdAndDelete(chatId);
    } catch (error) {
        processMongoError(error);
    }

    return;
});

export default {
    getAllChatRecords,
    getPersonalChatRecords,
    getGroupChatRecords,
    getParticipantsOfChatRecord,
    createChatRecord,
    createGroupChatRecord,
    addParticipantRecord,
    removeParticipantRecord,
    updateChatRecord,
    deleteChatRecord,
    deleteGroupChatRecord,
};
