import { Server, Socket } from "socket.io";
import logger from "@src/configs/logger.config";
import { handleConnection } from "./events/connection.handler";

export default function registerSocketHandlers(io: Server) {
    io.on("connection", (socket: Socket) => {
        logger.debug("sockets: new connection %s", socket.id);
        
        handleConnection(socket, io);
    });
}
