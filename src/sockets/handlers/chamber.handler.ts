import { Socket } from "socket.io";
import logger from "@src/configs/logger.config";
import socketService from "@src/services/socket.service";
import chamberService from "@src/services/chamber.service";

const socketAsync = (handler: Function) => {
    return async (...args: any[]) => {
        try {
            await handler(...args);
        } catch (err) {
            logger.error("chamber.handler: Socket Error:", err);

            const lastArg = args[args.length - 1];
            if (typeof lastArg === "function") {
                lastArg({ ok: false, error: "Internal Server Error" });
            }
        }
    };
};

export default function registerChamberHandler(socket: Socket) {
    socket.on(
        "chamber:join",
        socketAsync(
            (data: { chamberId: string; seerId: string; epithet: string, guise: string }, cb: Function) => {
                const { chamberId, seerId, epithet, guise } = data;
                const targetChamberId = chamberId || chamberService.allocateChamber();
                const targetChamber = chamberService.retrieveChamber(targetChamberId);

                if (!targetChamber) {
                    return cb && cb({ ok: false, message: "chamber not found" });
                }

                if (targetChamber.seers.length >= targetChamber.pact.plenum) {
                    return cb && cb({ ok: false, message: "chamber is full" });
                }

                socket.join(targetChamberId);

                const registered = chamberService.registerSeer(targetChamberId, {
                    seerId: seerId || `seer_${socket.id}`,
                    socketId: socket.id,
                    epithet: epithet || "Anon",
                    guise: guise || `https://api.dicebear.com/7.x/notionists/svg?seed=${epithet || "Anon"}`,
                });

                if (!registered.ok) {
                    return cb && cb({ ok: false, message: "failed to join chamber" });
                }

                socketService.emitToChamber(targetChamberId, "chamber:sync", {
                    chamberId: targetChamberId,
                    seers: chamberService.retrieveSeers(targetChamberId),
                });

                logger.info("chamber.handler: player %s joined chamber %s", registered.seer?.socketId, targetChamberId);

                return (
                    cb && cb({ ok: true, message: "joined chamber", chamberId: targetChamberId, seer: registered.seer })
                );
            }
        )
    );

    socket.on(
        "chamber:leave",
        socketAsync((data: { chamberId: string }, cb: Function) => {
            const { chamberId } = data;
            const { deregistered, chamberDisposed, seer } = chamberService.deregisterSeer(chamberId, socket.id);

            if (!deregistered) {
                return cb && cb({ ok: false, message: "failed to leave chamber" });
            }

            socket.leave(chamberId);

            socketService.emitToChamber(chamberId, "chamber:sync", {
                chamberId,
                seers: chamberService.retrieveSeers(chamberId),
            });

            if (chamberDisposed) {
                logger.info("chamber.handler: last player %s left, disposed chamber %s", seer?.socketId, chamberId);
            } else {
                logger.info("chamber.handler: player %s left from chamber %s", socket.id, chamberId);
            }

            return cb && cb({ ok: true, message: "left chamber" });
        })
    );

    socket.on(
        "disconnecting",
        socketAsync(() => {
            const joinedChambers = Array.from(socket.rooms).filter((r) => r !== socket.id);

            for (const chamberId of joinedChambers) {
                logger.info(`chamber.handler: cleanup for socket ${socket.id} in chamber ${chamberId}`);

                const { deregistered, chamberDisposed, seer } = chamberService.deregisterSeer(chamberId, socket.id);

                if (deregistered && !chamberDisposed) {
                    socketService.emitToChamber(chamberId, "chamber:sync", {
                        chamberId,
                        seers: chamberService.retrieveSeers(chamberId),
                    });

                    socketService.emitToChamber(chamberId, "sys:message", {
                        text: seer?.isCaster
                            ? `${seer?.epithet} (caster) has disconnected.`
                            : `${seer?.epithet} has disconnected.`,
                    });
                }
            }
        })
    );
}
