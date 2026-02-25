import { Server, Socket } from "socket.io";
import logger from "@src/configs/logger.config";
import registerChamberHandler from "./handlers/chamber.handler";
import registerRuneHandler from "./handlers/rune.handler";
import registerRitualHandler from "./handlers/ritual.handler";

const socketAsync = (handler: Function) => {
    return async (...args: any[]) => {
        try {
            await handler(...args);
        } catch (err) {
            logger.error("socket.handler: Socket Error:", err);

            const lastArg = args[args.length - 1];
            if (typeof lastArg === "function") {
                lastArg({ ok: false, error: "Internal Server Error" });
            }
        }
    };
};

export default function registerSocketHandlers(io: Server) {
    io.on("connection", (socket: Socket) => {
        logger.debug("socket.handler: Connected new socket %s", socket.id);

        socket.on(
            "sys:greet",
            socketAsync((data: any, cb: Function) => {
                logger.debug("socket.handler: %s greets, %s", socket.id, data?.greeting);

                if (cb) cb({ ok: true, greeting: `Hello ${socket.id}`, timestamp: Date.now() });
            })
        );

        socket.on(
            "sys:online",
            socketAsync((data: any, cb: Function) => {
                logger.debug("socket.handler: %s is online with data: %o", socket.id, data);

                if (cb) cb({ ok: true, timestamp: Date.now() });
            })
        );

        registerChamberHandler(socket);
        registerRuneHandler(socket);
        registerRitualHandler(socket);
    });
}
