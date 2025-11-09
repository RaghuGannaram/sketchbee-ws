import http from "http";
import { Server, Socket } from "socket.io";
// import { getFrontendURL } from "@src/utils/env-info";
import logger from "@src/configs/logger.config";

function setupSocketIO(server: http.Server): void {
    // const frontendURL = getFrontendURL();

    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket: Socket) => {
        logger.debug("socket.config: socket client connected %s", socket.id);

        socket.on("disconnecting", (reason) => {
            logger.debug("socket.config: client disconnecting %o with reason", socket.id, reason);
        });

        socket.on("disconnect", (reason) => {
            logger.debug("socket.config: client disconnected %o with reason", socket.id, reason);
        });

        socket.on("online", (data) => {
            logger.debug("socket.config: user online %s", data.user.handle);
            socket.join(data.chatId);
        });

        // socket.on("private message", (data) => {
        //     logger.debug("socket.config: user private message %o", data);
        //     io.to(data.chatId).emit("private message", data.content);
        // });

        // socket.on("typing", (chatId, user) => {
        //     socket.to(chatId).emit("typing", user);
        // });

        // socket.on("stop typing", (chatId, user) => {
        //     socket.to(chatId).emit("stop typing", user);
        // });
    });
}

export default setupSocketIO;
