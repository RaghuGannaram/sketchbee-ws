import { Socket } from "socket.io";
import logger from "@src/configs/logger.config";
import socketService from "@src/services/socket.service";
import ritualService from "@src/services/ritual.service";
import { Rites } from "@src/types/ritual.types";

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

function emitRitualOutcome(outcome: any, socket: Socket) {
    const chamberId = outcome.chamberId;

    switch (outcome.rite) {
        case Rites.DIVINATION:
            socketService.emitToChamber(chamberId, "ritual:prepared", {
                casterId: outcome.casterId,
                timeLeftMs: outcome.timeLeftMs,
            });

            socketService.emitToSocket(socket.id, "ritual:prophecies", {
                prophecies: outcome.prophecies,
                casterId: outcome.casterId,
            });
            break;

        case Rites.MANIFESTATION:
            socketService.emitToChamber(chamberId, "ritual:started", {
                casterId: outcome.casterId,
                omen: outcome.omen,
                timeLeftMs: outcome.timeLeftMs,
            });
            break;

        case Rites.REVELATION:
            socketService.emitToChamber(chamberId, "ritual:reveal", {
                enigma: outcome.enigma,
                seers: outcome.seers,
                timeLeftMs: outcome.timeLeftMs,
            });
            break;

        case Rites.DISBANDMENT:
            socketService.emitToChamber(chamberId, "ritual:game_over", { message: outcome.message });
            break;

        default:
            logger.warn(`Handler received unknown rite: ${outcome.rite}`);
    }
}

export default function registerRitualHandler(socket: Socket) {
    socket.on(
        "ritual:prepare",
        socketAsync(({ chamberId }: { chamberId: string }, cb: Function) => {
            if (!chamberId) {
                return cb && cb({ ok: false, message: "invalid chamberId" });
            }

            const outcome = ritualService.advanceRitual(chamberId);

            if (!outcome.ok) {
                return cb && cb({ ok: false, message: "Ritual cannot advance (e.g., quorum not met)." });
            }

            emitRitualOutcome(outcome, socket);
            return cb && cb({ ok: true, message: "Ritual advancing to Divination." });
        })
    );

    socket.on(
        "ritual:prophecy",
        socketAsync(({ chamberId, casterId, prophecy }: { chamberId: string; casterId: string; prophecy: string }, cb: Function) => {
            const seerId = socket.data.seerId; 

            if (!chamberId || !seerId || seerId !== casterId || !prophecy) {
                return cb && cb({ ok: false, message: "invalid parameters or not the caster" });
            }

            try {
                // The service handles the input, stops the timer, and starts the next phase
                const outcome = ritualService.handleProphecySelection(chamberId, casterId, prophecy);

                // Emitter logic handles the broadcast of the new MANIFESTATION state
                emitRitualOutcome(outcome, socket);

                return cb && cb({ ok: true, message: "Enigma manifested, drawing phase started." });
            } catch (error) {
                logger.error("ritual:prophecy error:", error);
                return cb && cb({ ok: false, message: error.message });
            }
        })
    );

    // --- Player Guess Event (Interacts with the RuneService, but could trigger Ritual end) ---
    // Note: The logic for rune:script (guessing) should be in rune.handler, but if a guess ends the round early,
    // it must call ritualService.endManifestationEarly().
    // Example: rune.handler on 'rune:script' might look like this:
    /*
    socket.on('rune:script', async (data, cb) => {
        // ... (existing guess logic)
        if (enigmaUnveiled.roundOver) { 
            const outcome = ritualService.endManifestationEarly(data.chamberId);
            emitRitualOutcome(outcome, socket); // Transition to REVELATION
        }
        // ...
    });
    */

    // Clean up timer on disconnect (Optional but recommended)
    socket.on(
        "disconnecting",
        socketAsync(() => {
            const { chamberId, seerId } = socket.data;
            if (chamberId && seerId) {
                // You might need more complex logic here (e.g., if the caster disconnects)
                // For now, just ensure the service can stop any active timer associated with the room
                // Note: The main logic for handling disconnect should reside in chamber.handler
            }
        })
    );
}
