import { catchAsyncHttpError } from "@src/utils/application-errors";
import type { Request, Response, NextFunction } from "express";

export function catchAsyncError<T>(routeHandler: (req: Request, res: Response, next: NextFunction) => Promise<T>) {
	return function (req: Request, res: Response, next: NextFunction) {
		return Promise.resolve(catchAsyncHttpError(routeHandler)(req, res, next)).catch(next);
	};
}

export default catchAsyncError;
