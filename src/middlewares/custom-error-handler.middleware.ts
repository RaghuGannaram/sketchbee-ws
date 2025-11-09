import envAccess from "@src/configs/env.config";
import logger from "@src/configs/logger.config";
import { errorExposureDepthCode, type ApplicationError } from "@src/types/index";
import type { Request, Response, NextFunction } from "express";

const currentEnv = envAccess.app.env();
const errorExposureDepth = errorExposureDepthCode[envAccess.error.exposureDepth()];

function customErrorHandler(error: ApplicationError, req: Request, res: Response, _next: NextFunction) {
	logger.error(`${req.method} ${req.originalUrl}: ${error.status} - ${error.message} - ${req.ip} \n%o`, error);

	const appError = formatError(error, 1);

	const { status, message, stack, ...rest } = appError;
	const response: ApplicationError = {
		status: status ?? 500,
		message: error.message ?? "INTERNAL_SERVER_ERROR",
		...rest,
	};

	if (currentEnv === "development" && stack) {
		response.stack = stack;
	}

	res.status(appError.status).json(response);
}

function formatError(error: ApplicationError, depth: number): ApplicationError {
	const { cause, stack, ...rest } = error;

	let currentError: ApplicationError;

	if (depth >= errorExposureDepth) {
		return { ...rest };
	}

	currentError = depth === 1 && stack ? { ...rest, stack: stack } : { ...rest };

	if (cause) {
		currentError.cause = cause instanceof Error ? formatError(cause as ApplicationError, depth + 1) : cause;
	}

	return currentError;
}

export default customErrorHandler;
