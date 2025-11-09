import type { Request, Response } from "express";
import ms from "ms";
import authBusinessService from "@src/services/auth.business";
import { registrationSchema, loginSchema } from "@src/schemas/auth.schema";
import catchAsyncError from "@src/middlewares/catch-async-error.middleware";
import { HttpError, HttpErrors, processValidationError } from "@src/utils/application-errors";
import { getCurrentEnv, getJWTInfo } from "@src/utils/env-info";
import type { IRegistration, ILogin, IController } from "@src/types";

const currentEnv = getCurrentEnv();
const { refreshTokenValidity } = getJWTInfo();

const register: IController = catchAsyncError(async function (req: Request, res: Response) {
    let registrationData: IRegistration | null = null;
    try {
        registrationData = await registrationSchema.validateAsync(req.body);
    } catch (error) {
        processValidationError(error);
    }

    const { data, accessToken, refreshToken } = await authBusinessService.createUser(registrationData);

    const expires = new Date(Date.now() + ms(refreshTokenValidity));

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: currentEnv === "production",
        sameSite: "strict",
        path: "/api/v1/auth/*",
        expires: expires,
    });

    res.status(201).json({
        message: "user registration successful.",
        profile: data,
        accessToken,
    });
});

const login: IController = catchAsyncError(async function (req: Request, res: Response) {
    let userCredentials: ILogin | null = null;
    try {
        userCredentials = await loginSchema.validateAsync(req.body);
    } catch (error) {
        processValidationError(error);
    }

    const { data, accessToken, refreshToken } = await authBusinessService.validateUser(userCredentials);

    const expires = new Date(Date.now() + ms(refreshTokenValidity));

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: currentEnv === "production",
        sameSite: "strict",
        path: "/api/v1/auth/",
        expires: expires,
    });

    res.status(200).json({
        message: "user login successful.",
        profile: data,
        accessToken,
    });
});

const refresh: IController = catchAsyncError(async function (req: Request, res: Response) {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw new HttpError(400, HttpErrors.BAD_REQUEST, "refresh token not provided.");

    const { newAccessToken, newRefreshToken } = await authBusinessService.refreshUserTokens(refreshToken);

    const expires = new Date(Date.now() + ms(refreshTokenValidity));

    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: currentEnv === "production",
        sameSite: "strict",
        path: "/api/v1/auth/",
        expires: expires,
    });

    res.status(201).json({
        message: "tokens refresh successful.",
        accessToken: newAccessToken,
    });
});

const logout: IController = catchAsyncError(async function (req: Request, res: Response) {
    const { refreshToken } = req.cookies;
    if (!refreshToken) throw new HttpError(400, HttpErrors.BAD_REQUEST, "refresh token not provided.");

    await authBusinessService.clearUserTokens(refreshToken);

    res.cookie("refreshToken", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/v1/auth/",
        expires: new Date(0),
    });

    res.status(200).json({
        message: "user logout successful.",
    });
});

export default { register, login, refresh, logout };
