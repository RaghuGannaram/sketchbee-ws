import { Socket } from "socket.io";
import logger from "@src/configs/logger.config";
import socketService from "@src/services/socket.service";
import type { ISigil } from "@src/types/rune.types";

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
        socketAsync((data: { chamberId: string; casterId: string; sigils: ISigil[] }, cb: Function) => {
            const { chamberId, casterId, sigils } = data;

            if (!chamberId) {
                return cb && cb({ ok: false, message: "invalid chamberId" });
            }

            if (!Array.isArray(sigils) || sigils.length === 0) {
                return cb && cb({ ok: false, message: "invalid sigils data" });
            }

            socketService.broadcastToChamberExcept(chamberId, casterId, "rune:sigil", {
                chamberId,
                casterId,
                sigils,
            });

            return cb && cb({ ok: true, message: "sigils broadcasted" });
        })
    );

    socket.on(
        "rune:shift",
        socketAsync((data: { chamberId: string; casterId: string; vision: string }, cb: Function) => {
            const { chamberId, casterId, vision } = data;

            if (!chamberId || !casterId || !vision) {
                return cb && cb({ ok: false, message: "invalid parameters" });
            }
            socketService.broadcastToChamberExcept(chamberId, casterId, "rune:shift", {
                chamberId,
                casterId,
                vision,
            });

            return cb && cb({ ok: true, message: "vision broadcasted" });
        })
    );

    socket.on(
        "rune:void",
        socketAsync((data: { chamberId: string; casterId: string }, cb: Function) => {
            const { chamberId, casterId } = data;
            if (!chamberId || !casterId) {
                return cb && cb({ ok: false, message: "invalid parameters" });
            }

            socketService.broadcastToChamberExcept(chamberId, casterId, "rune:void", {
                chamberId,
                casterId,
            });
            return cb && cb({ ok: true, message: "vellum cleared" });
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
