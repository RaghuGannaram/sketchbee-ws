import http from "http";
import { Server } from "socket.io";
import envAccess from "./env.config";
import logger from "@src/configs/logger.config";
import registerSocketHandlers from "@src/sockets";

function setupSocketIO(server: http.Server): void {
    const apiGatewayUrl = envAccess.api.gatewayUrl();

    const io = new Server(server, {
        cors: {
            origin: apiGatewayUrl,
            methods: ["GET", "POST"],
        },
    });

    logger.info("socket.config: socket.io initialized");

    registerSocketHandlers(io);
}

export default setupSocketIO;
