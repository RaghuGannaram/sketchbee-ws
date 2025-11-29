import { Server, Socket } from "socket.io";
import logger from "@src/configs/logger.config";
import registerChamberHandlers from "./handlers/chamber.handler";
// import registerGestureHandlers from "./handlers/gesture.handler";

export default function registerSocketHandlers(io: Server) {
    io.on("connection", (socket: Socket) => {
        logger.debug("socket.handler: Connected new socket %s", socket.id);

        registerChamberHandlers(socket);

        // registerGestureHandlers(socket);
    });
}
