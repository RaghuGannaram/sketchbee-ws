import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import api_v1 from "@src/api/v1";

import customErrorHandler from "@src/middlewares/custom-error-handler.middleware";
import defaultMiddleware from "@src/middlewares/default.middleware";
import morganMiddleware from "@src/middlewares/morgan.middleware";

import envAccess from "@src/configs/env.config";
import logger from "@src/configs/logger.config";
import "@src/configs/session.config";
import "@src/configs/mongo.config";

const app: express.Application = express();

const apiGatewayURL = envAccess.api.gatewayUrl();
const corsOptions = {
    origin: apiGatewayURL,
    credentials: true,
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(morganMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/health-check", (_req: Request, res: Response) => {
    logger.info("Health check");
    res.status(200).json({ message: "OK" });
});

app.use("/api/v1", api_v1);

app.use(defaultMiddleware);
app.use(customErrorHandler);

export default app;
