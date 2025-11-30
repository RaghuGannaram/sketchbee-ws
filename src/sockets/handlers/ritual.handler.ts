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

            const ritualPrepared = ritualService.prepareRitualCycle(chamberId);
            if (!ritualPrepared) {
                return cb && cb({ ok: false, message: "failed to prepare ritual" });
            }

            const chamber = chamberService.retrieveChamber(chamberId);

            if (!chamber || !chamber.casterId) {
                return cb && cb({ ok: false, message: "chamber or caster not found" });
            }

            socketService.emitToChamber(chamberId, "ritual:prepared", { casterId: chamber.casterId });
            socketService.emitToSocket(chamber.casterId, "ritual:prophecies", { prophecies: chamber.prophecies });

            return cb && cb({ ok: true, message: "ritual prepared" });
        })
    );

    socket.on(
        "ritual:prophecy",
        socketAsync(({ chamberId, prophecy }: { chamberId: string; prophecy: string }, cb: Function) => {
            if (!chamberId || !prophecy) {
                return cb && cb({ ok: false, message: "invalid parameters" });
            }

            const enigmaManifested = ritualService.manifestEnigma(chamberId, prophecy);

            if (!enigmaManifested) {
                return cb && cb({ ok: false, message: "failed to manifest enigma" });
            }

            socketService.emitToChamber(chamberId, "ritual:started", {
                casterId: socket.id,
                prophecyLength: prophecy.length,
                omen: "_ _ _ _",
            });
        })
    );
}
