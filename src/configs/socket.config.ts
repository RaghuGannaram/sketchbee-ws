import http from "http";
import { Server } from "socket.io";
import envAccess from "./env.config";
import logger from "@src/configs/logger.config";
import socketService from "@src/services/socket.service";
import registerSocketHandlers from "@src/sockets";

function setupSocketIO(server: http.Server): void {
	const apiGatewayUrl = envAccess.api.gatewayUrl();

	const io = new Server(server, {
		cors: {
			origin: apiGatewayUrl,
			methods: ["GET", "POST"],
		},
	});

	socketService.initIO(io);
	registerSocketHandlers(io);

	logger.info("socket.config: socket.io initialized");
}

export default setupSocketIO;
