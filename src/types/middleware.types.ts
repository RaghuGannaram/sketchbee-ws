import type { Request, Response, NextFunction } from "express";
import type { IAuthUser } from "./auth.types";

export interface IController {
	(req: Request, res: Response, next: NextFunction): Promise<void>;
}

export interface IVerifiedRequest extends Request {
	user: IAuthUser;
}
