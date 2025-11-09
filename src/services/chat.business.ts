import chatDataService from "@src/services/chat.data";
import awsDataService from "@src/services/aws.data";
import type { IAuthUser } from "@src/types";
import { BusinessError, BusinessErrors, catchAsyncBusinessError } from "@src/utils/application-errors";

const getAllChats = catchAsyncBusinessError(async function (authUser: IAuthUser) {
    const chats = await chatDataService.getAllChatRecords(authUser.id);

    const processedChats = await Promise.all(
        chats.map(async (chat) => {
            if (chat.isGroupChat) {
                chat.displayPicture = await awsDataService.getFile(chat.displayPicture);
            } else {
                chat.participants = await Promise.all(
                    chat.participants.map(async (participant: any) => {
                        participant.avatar = await awsDataService.getFile(participant.avatar);
                        return participant;
                    })
                );
            }
            return chat;
        })
    );

    return processedChats;
});

const getPrivateChats = catchAsyncBusinessError(async function (authUser: IAuthUser) {
    const chats = await chatDataService.getPersonalChatRecords(authUser.id);

    return chats;
});

const getGroupChats = catchAsyncBusinessError(async function (authUser: IAuthUser) {
    const chats = await chatDataService.getGroupChatRecords(authUser.id);

    return chats;
});

const getChatMembers = catchAsyncBusinessError(async function (chatId: string) {
    const members = await chatDataService.getParticipantsOfChatRecord(chatId);

    return members;
});

const createChat = catchAsyncBusinessError(async function (authUser: IAuthUser, userId: string) {
    const participants: string[] = [authUser.id, userId];

    if (authUser.id === userId) throw new BusinessError(BusinessErrors.LOGICAL_ERROR, "you can't chat with yourself.");

    const chat = await chatDataService.createChatRecord(participants);

    chat.participants = await Promise.all(
        chat.participants.map(async (participant: any) => {
            participant.avatar = await awsDataService.getFile(participant.avatar);
            return participant;
        })
    );

    return chat;
});

const createGroupChat = catchAsyncBusinessError(async function (
    authUser: IAuthUser,
    groupName: string,
    participantList: string[]
) {
    const participants: string[] = [authUser.id, ...participantList];
    const chat = await chatDataService.createGroupChatRecord(groupName, participants);

    return chat;
});

const joinGroup = catchAsyncBusinessError(async function (authUser: IAuthUser, chatId: string, participantId: string) {
    if (authUser.role !== "admin" && authUser.id !== participantId)
        throw new BusinessError(
            BusinessErrors.UNAUTHORIZED_ACCESS,
            "you can't join a group on behalf of another user."
        );
    const chat = await chatDataService.addParticipantRecord(chatId, participantId);

    return chat;
});

const leaveGroup = catchAsyncBusinessError(async function (authUser: IAuthUser, chatId: string, participantId: string) {
    if (authUser.role !== "admin" && authUser.id !== participantId)
        throw new BusinessError(
            BusinessErrors.UNAUTHORIZED_ACCESS,
            "you can't leave a group on behalf of another user."
        );
    const chat = await chatDataService.removeParticipantRecord(chatId, participantId);

    return chat;
});

const deleteChat = catchAsyncBusinessError(async function (authUser: IAuthUser, chatId: string) {
    const participants = await chatDataService.getParticipantsOfChatRecord(chatId);

    if (authUser.role !== "admin" && !participants.includes(authUser.id))
        throw new BusinessError(BusinessErrors.UNAUTHORIZED_ACCESS, "you can't delete a chat you are not part of.");

    await chatDataService.deleteChatRecord(chatId);

    return;
});

const deleteGroupChat = catchAsyncBusinessError(async function (authUser: IAuthUser, chatId: string) {
    const participants = await chatDataService.getParticipantsOfChatRecord(chatId);

    if (authUser.role !== "admin" && !participants.includes(authUser.id))
        throw new BusinessError(BusinessErrors.UNAUTHORIZED_ACCESS, "you can't delete a chat you are not part of.");

    await chatDataService.deleteGroupChatRecord(chatId);

    return;
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
