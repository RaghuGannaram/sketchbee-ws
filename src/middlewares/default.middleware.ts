import { HttpError, HttpErrors } from "@src/utils/application-errors";
import type { Request, Response, NextFunction } from "express";

const defaultMiddleware = (req: Request, _res: Response, next: NextFunction) => {
	const error = new HttpError(404, HttpErrors.NOT_FOUND, `cannot ${req.method} ${req.originalUrl}`);
	next(error);
};

export default defaultMiddleware;
