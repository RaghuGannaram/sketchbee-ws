import bcrypt from "bcryptjs";
import UserModel, { type UserDocument } from "@src/models/User.model";
import {
    DataError,
    DataErrors,
    processMongoError,
    processCryptoError,
    catchAsyncDataError,
} from "@src/utils/application-errors";
import type { IRegistration, ILogin, IUser } from "@src/types";
import logger from "@src/configs/logger.config";

const createUserRecord = catchAsyncDataError(async function (registrationData: IRegistration): Promise<IUser> {
    logger.debug(`auth.data: creating new user record for user: %o`, registrationData);

    try {
        const salt = await bcrypt.genSalt(10);
        registrationData.password = await bcrypt.hash(registrationData.password, salt);
    } catch (error) {
        processCryptoError(error);
    }

    let userDoc: UserDocument | null = null;

    try {
        const newUserInstance = new UserModel(registrationData);
        userDoc = await newUserInstance.save();
    } catch (error) {
        processMongoError(error);
    }

    if (!userDoc) throw new DataError(DataErrors.DB_WRITE_OPERATION_FAILED, "user record creation failed.");

    return userDoc.toObject();
});

const validateUserRecord = catchAsyncDataError(async function (userCredentials: ILogin): Promise<IUser> {
    logger.debug(`auth.data: reading user record for user: %o`, userCredentials);

    const { email, password } = userCredentials;

    let userDoc: UserDocument | null = null;

    try {
        userDoc = await UserModel.findOne({ email: email })
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

    let verified: boolean = false;

    try {
        verified = await bcrypt.compare(password, userDoc.password);
    } catch (error) {
        processCryptoError(error);
    }

    if (!verified) throw new DataError(DataErrors.DATA_INVALID_PASSWORD, "password verification failed.");

    return userDoc.toObject();
});

export default { createUserRecord, validateUserRecord };
