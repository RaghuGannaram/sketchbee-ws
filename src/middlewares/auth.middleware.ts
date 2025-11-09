import tokenDataService from "@src/services/token.data";
import type { IAuthUser, IVerifiedRequest } from "@src/types";
import { HttpError, HttpErrors } from "@src/utils/application-errors";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import catchAsyncError from "./catch-async-error.middleware";

const authenticate: RequestHandler = catchAsyncError(async (req: Request, _res: Response, next: NextFunction) => {
	let accessToken = req.headers["authorization"];

	if (!accessToken) throw new HttpError(401, HttpErrors.UNAUTHORIZED, "Access token not provided.");

	if (!accessToken.startsWith("Bearer ")) throw new HttpError(401, HttpErrors.UNAUTHORIZED, "Invalid authorization scheme.");

	accessToken = accessToken.slice(7);

	const decoded = await tokenDataService.validateAccessToken(accessToken);

	const { profile } = decoded;

	const user: IAuthUser = {
		id: profile.id,
		email: profile.email,
		username: profile.username,
		authProvider: profile.authProvider,
		avatarUrl: profile.avatarUrl,
		verified: profile.verified,
		premium: profile.premium,
		role: profile.role,
		settings: profile.settings,
		createdAt: profile.createdAt,
		lastLoginAt: profile.lastLoginAt ?? "",
	};

	(req as IVerifiedRequest).user = user;

	next();
});

export default authenticate;
