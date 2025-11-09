import JWT from "jsonwebtoken";
import ms from "ms";
import sessionStore from "@src/configs/session.config";
import { getJWTInfo } from "@src/utils/env-info";
import {
    DataError,
    DataErrors,
    catchAsyncDataError,
    processTokenError,
    processCacheError,
} from "@src/utils/application-errors";
import type { ITokenPayload } from "@src/types";
import logger from "@src/configs/logger.config";

const { accessTokenSecret, refreshTokenSecret, accessTokenValidity, refreshTokenValidity, refreshTokenMaxAge } =
    getJWTInfo();

const issueAccessToken = catchAsyncDataError(async (user: ITokenPayload) => {
    logger.debug(`token.service: issuing access token for user: %o`, user);

    const payload = {
        id: user.id,
        fullname: user.fullname,
        handle: user.handle,
        email: user.email,
        role: user.role,
        type: "access",
    };

    const options = {
        expiresIn: ms(accessTokenValidity) / 1000,
        issuer: "sketchbee.raghugannaram.com",
        audience: user.id,
    };

    const token = JWT.sign(payload, accessTokenSecret, options);

    try {
        await sessionStore.set(`access:${user.id}`, token, ms(accessTokenValidity) / 1000);
    } catch (error) {
        processCacheError(error);
    }

    return token;
});

const issueRefreshToken = catchAsyncDataError(async (user: ITokenPayload) => {
    logger.debug(`token.service: issuing refresh token for user: %o`, user);

    const payload = {
        id: user.id,
        fullname: user.fullname,
        handle: user.handle,
        email: user.email,
        role: user.role,
        type: "refresh",
    };

    const options = {
        expiresIn: ms(refreshTokenValidity) / 1000,
        issuer: "sketchbee.raghugannaram.com",
        audience: user.id,
    };

    const token = JWT.sign(payload, refreshTokenSecret, options);

    try {
        await sessionStore.set(`refresh:${user.id}`, token, ms(refreshTokenValidity) / 1000);
    } catch (error) {
        processCacheError(error);
    }

    return token;
});

const validateAccessToken = catchAsyncDataError(async (accessToken: string) => {
    logger.debug(`token.service: validating access token...`);

    let decoded;

    try {
        decoded = JWT.verify(accessToken, accessTokenSecret) as ITokenPayload;
    } catch (error) {
        processTokenError(error);
    }

    let storedAccessToken: string | null = null;
    try {
        storedAccessToken = await sessionStore.get(`access:${decoded.id}`);
    } catch (error) {
        processCacheError(error);
    }

    if (accessToken !== storedAccessToken) throw new DataError(DataErrors.DATA_INVALID_TOKEN, "invalid access token.");

    return decoded;
});

const validateRefreshToken = catchAsyncDataError(async (refreshToken: string) => {
    logger.debug(`token.service: validating refresh token...`);

    let decoded;

    try {
        decoded = JWT.verify(refreshToken, refreshTokenSecret) as ITokenPayload;
    } catch (error) {
        processTokenError(error);
    }

    let storedRefreshToken: string | null = null;
    try {
        storedRefreshToken = await sessionStore.get(`refresh:${decoded.id}`);
    } catch (error) {
        processCacheError(error);
    }

    if (refreshToken !== storedRefreshToken) {
        throw new DataError(DataErrors.DATA_INVALID_TOKEN, "incorrect refresh token.");
    }

    if (Date.now() - (decoded.iat ?? 0) * 1000 > ms(refreshTokenMaxAge)) {
        throw new DataError(DataErrors.TOKEN_EXCEEDED_MAX_AGE, "refresh token has exceeded maximum lifetime.");
    }

    return decoded;
});

const deleteUserTokens = catchAsyncDataError(async (id: string) => {
    logger.debug(`token.service: deleting user tokens...`);

    try {
        await Promise.all([await sessionStore.delete(`access:${id}`), await sessionStore.delete(`refresh:${id}`)]);
    } catch (error) {
        processCacheError(error);
    }
    return;
});

export default { issueAccessToken, issueRefreshToken, validateAccessToken, validateRefreshToken, deleteUserTokens };
