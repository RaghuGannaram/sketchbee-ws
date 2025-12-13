import { Socket } from "socket.io";
import logger from "@src/configs/logger.config";
import ritualService from "@src/services/ritual.service";
import chamberService from "@src/services/chamber.service";
import { emitRitual } from "@src/sockets/emitters/ritual.emitter";
import { Rites } from "@src/types/chamber.types";

const socketAsync = (handler: Function) => {
    return async (...args: any[]) => {
        try {
            await handler(...args);
        } catch (err) {
            logger.error("ritual.handler: Socket Error:", err);
            const lastArg = args[args.length - 1];
            if (typeof lastArg === "function") {
                lastArg({ ok: false, error: "Internal Server Error" });
            }
        }
    };
};

export default function registerRitualHandler(socket: Socket) {
    socket.on(
        "ritual:pledge",
        socketAsync(({ chamberId }: { chamberId: string }, cb: Function) => {
            if (!chamberId) {
                return cb && cb({ ok: false, message: "invalid parameters" });
            }

            const chamber = chamberService.retrieveChamber(chamberId);
            if (!chamber) {
                return cb && cb({ ok: false, message: "chamber not found" });
            }

            if (chamber.rite !== Rites.CONGREGATION) {
                return cb && cb({ ok: false, message: "ritual already in progress" });
            }

            const oracle = ritualService.executeRite(chamber);

            if (!oracle.ok) {
                return cb && cb({ ok: false, message: oracle.message });
            }

            return cb && cb({ ok: true, message: "ritual advanced" });
        })
    );

    socket.on(
        "ritual:prophecy",
        socketAsync(({ chamberId, prophecy }: { chamberId: string; prophecy: string }, cb: Function) => {
            if (!chamberId || !prophecy) return cb({ ok: false, message: "Invalid parameters" });

            const seerId = socket.data.seerId;
            if (!seerId) return cb({ ok: false, message: "Seer not authenticated" });

            const chamber = chamberService.retrieveChamber(chamberId);
            if (!chamber) return cb({ ok: false, message: "Chamber not found" });

            const oracle = ritualService.sealProphecy(chamber, seerId, prophecy);

            if (!oracle.ok) {
                return cb({ ok: false, message: oracle.message });
            }

            emitRitual(oracle);
            cb({ ok: true, message: "Prophecy sealed" });
        })
    );
}
