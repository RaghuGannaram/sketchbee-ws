import userDataService from "@src/services/user.data";
import awsDataService from "@src/services/aws.data";
import tokenDataService from "@src/services/token.data";
import imageDataService from "@src/services/image.data";
import constants from "@src/constants";
import { BusinessError, BusinessErrors, catchAsyncBusinessError } from "@src/utils/application-errors";
import type { IAuthUser } from "@src/types";
import logger from "@src/configs/logger.config";

const getAllUsers = catchAsyncBusinessError(async function () {
	logger.info(`user.business: getting all users`);

	const users = await userDataService.getAllUserRecords();

	const processedUsers = await Promise.all(
		users.map(async (user) => {
			[user.avatar, user.background] = await Promise.all([await awsDataService.getFile(user.avatar), await awsDataService.getFile(user.background)]);

			return user;
		})
	);

	return processedUsers;
});

const getUserByID = catchAsyncBusinessError(async function (userId: string) {
	logger.info(`user.business: getting user details for user: %s`, userId);

	const user = await userDataService.getUserRecordByID(userId);

	[user.avatar, user.background] = await Promise.all([await awsDataService.getFile(user.avatar), await awsDataService.getFile(user.background)]);

	return user;
});

const updateUserInfo = catchAsyncBusinessError(async function (authUser: IAuthUser, userId: string, updateData: any) {
	logger.info(`user.business: updating user details for user: %s`, userId);

	if (authUser.role !== "admin" && authUser.id !== userId) throw new BusinessError(BusinessErrors.UNAUTHORIZED_ACCESS, "you can only update your account.");

	const updatedUser = await userDataService.updateUserRecord(userId, updateData);

	[updatedUser.avatar, updatedUser.background] = await Promise.all([
		await awsDataService.getFile(updatedUser.avatar),
		await awsDataService.getFile(updatedUser.background),
	]);

	return updatedUser;
});

const updateUserImage = catchAsyncBusinessError(async function (authUser: IAuthUser, userId: string, updateData: any) {
	logger.info(`user.business: updating user image for user: %s`, userId);

	if (authUser.role !== "admin" && authUser.id !== userId) throw new BusinessError(BusinessErrors.UNAUTHORIZED_ACCESS, "you can update only your account.");

	const userToUpdate = await userDataService.getUserRecordByID(userId);

	let processedImageBuffer: Buffer;

	if (updateData.type === "avatar") {
		if (userToUpdate.avatar !== "default-avatar.png") await awsDataService.deleteFile(userToUpdate.avatar);

		processedImageBuffer = await imageDataService.processImage(updateData.file.buffer, {
			size: constants.AVATAR_SIZE,
		});
	} else {
		if (userToUpdate.background !== "default-background.jpg") await awsDataService.deleteFile(userToUpdate.background);

		processedImageBuffer = await imageDataService.processImage(updateData.file.buffer, {
			size: constants.BACKGROUND_SIZE,
		});
	}

	const uploadedFile = await awsDataService.uploadFile(`${authUser.id}_${updateData.type}_${Date.now()}`, processedImageBuffer);

	const updatedUser = await userDataService.updateUserRecord(userId, {
		[updateData.type]: uploadedFile,
	} as {
		[key in "avatar" | "background"]: string;
	});

	[updatedUser.avatar, updatedUser.background] = await Promise.all([
		await awsDataService.getFile(updatedUser.avatar),
		await awsDataService.getFile(updatedUser.background),
	]);

	return updatedUser;
});

const followUser = catchAsyncBusinessError(async function (authUser: IAuthUser, followeeId: string) {
	logger.info(`user.business: updating followees for user: %s`, authUser.id);

	if (authUser.id === followeeId) throw new BusinessError(BusinessErrors.LOGICAL_ERROR, "You can't follow yourself.");

	const response = await userDataService.updateUserFollowRecord(authUser.id, followeeId);

	return response;
});

const deleteUser = catchAsyncBusinessError(async function (authUser: IAuthUser, userId: string) {
	logger.info(`user.business: deleting user account for user: %s`, userId);

	if (authUser.role !== "admin" && authUser.id !== userId) throw new BusinessError(BusinessErrors.UNAUTHORIZED_ACCESS, "You can delete only your account.");

	const user = await userDataService.getUserRecordByID(userId);

	if (user.avatar !== "default-avatar.png") {
		await awsDataService.deleteFile(user.avatar);
	}
	if (user.background !== "default-background.jpg") {
		await awsDataService.deleteFile(user.background);
	}

	await tokenDataService.deleteUserTokens(userId);

	await Promise.all([userDataService.deleteUserRecord(userId)]);

	return;
});

export default {
	getAllUsers,
	getUserByID,
	updateUserInfo,
	updateUserImage,
	followUser,
	deleteUser,
};
