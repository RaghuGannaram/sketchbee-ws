import { Socket } from "socket.io";
import logger from "@src/configs/logger.config";
import socketService from "@src/services/socket.service";

const socketAsync = (handler: Function) => {
    return async (...args: any[]) => {
        try {
            await handler(...args);
        } catch (err) {
            logger.error("rune.handler: Socket Error:", err);

            const lastArg = args[args.length - 1];
            if (typeof lastArg === "function") {
                lastArg({ ok: false, error: "Internal Server Error" });
            }
        }
    };
};

export default function registerRuneHandler(socket: Socket) {
    socket.on(
        "rune:sigil",
        socketAsync((data: { chamberId: string; sigils: string[] }, cb: Function) => {
            const { chamberId, sigils } = data;

            if (!chamberId) {
                return cb && cb({ ok: false, message: "invalid chamberId" });
            }

            if (!Array.isArray(sigils) || sigils.length === 0) {
                return cb && cb({ ok: false, message: "invalid sigils data" });
            }

            socketService.broadcastToChamberExcept(chamberId, socket.id, "rune:sigil", {
                chamberId,
                sigils,
            });

            return cb && cb({ ok: true, message: "sigils broadcasted" });
        })
    );

    socket.on(
        "rune:script",
        socketAsync((data: { chamberId: string; epithet: string; script: string }, cb: Function) => {
            const { chamberId, epithet, script } = data;

            if (!chamberId || !epithet || !script) {
                return cb && cb({ ok: false, message: "invalid parameters" });
            }

            // TODO: Add logic here to check if 'script' matches the secret word (Game Logic)
            const runeUnvailed = false;

            if (runeUnvailed) {
                socketService.emitToChamber(chamberId, "rune:unvailed", { epithet });
            } else {
                socketService.emitToChamber(chamberId, "rune:script", {
                    epithet,
                    script,
                    isSystem: false,
                    timestamp: Date.now(),
                });
            }

            return cb && cb({ ok: true, message: "script broadcasted" });
        })
    );
}
