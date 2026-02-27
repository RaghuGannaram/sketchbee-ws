import type { Request, Response } from "express";
import chamberService from "@src/services/chamber.service";
import catchAsyncError from "@src/middlewares/catch-async-error.middleware";
import type { IController } from "@src/types";

const getAllChambers: IController = catchAsyncError(async function (_req: Request, res: Response) {
	const chambers = chamberService.retrieveChambers();

	res.status(200).json({ chambers: chambers });
});

export default { getAllChambers };
