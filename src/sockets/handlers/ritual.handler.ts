import { Socket } from "socket.io";
import logger from "@src/configs/logger.config";
import socketService from "@src/services/socket.service";
import ritualService from "@src/services/ritual.service";
import chamberService from "@src/services/chamber.service";

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

export default function registerRitualHandler(socket: Socket) {
    socket.on(
        "ritual:prepare",
        socketAsync(({ chamberId }: { chamberId: string }, cb: Function) => {
            if (!chamberId) {
                return cb && cb({ ok: false, message: "invalid chamberId" });
            }

            const prepared = ritualService.prepareRitual(chamberId);

            if (!prepared.ok) {
                return cb && cb({ ok: false, message: prepared.message });
            }

            const chamber = chamberService.retrieveChamber(chamberId);

            if (!chamber || !chamber.casterId) {
                return cb && cb({ ok: false, message: "chamber or caster not found" });
            }

            socketService.emitToChamber(chamberId, "ritual:prepared", { casterId: chamber.casterId });
            socketService.emitToSocket(prepared.caster!.socketId, "ritual:prophecies", {
                casterId: chamber.casterId,
                prophecies: chamber.prophecies,
            });

            return cb && cb({ ok: true, message: "ritual prepared" });
        })
    );

    socket.on(
        "ritual:prophecy",
        socketAsync(
            (
                { chamberId, casterId, prophecy }: { chamberId: string; casterId: string; prophecy: string },
                cb: Function
            ) => {
                if (!chamberId || !casterId || !prophecy) {
                    return cb && cb({ ok: false, message: "invalid parameters" });
                }

                const manifested = ritualService.manifestEnigma(chamberId, casterId, prophecy);

                if (!manifested.ok) {
                    return cb && cb({ ok: false, message: "failed to manifest enigma" });
                }

                socketService.emitToChamber(chamberId, "ritual:started", {
                    casterId: casterId,
                    omen: manifested.omen,
                });


                return cb && cb({ ok: true, message: "enigma manifested" });
            }
        )
    );
}
