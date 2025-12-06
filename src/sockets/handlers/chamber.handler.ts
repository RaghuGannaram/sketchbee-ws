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
        socketAsync((data: { epithet: string; guise: string; chamberId?: string; seerId?: string }, cb: Function) => {
            let { chamberId, seerId, epithet, guise } = data;

            if (!epithet || !guise) {
                return cb && cb({ ok: false, message: "epithet and guise are required to join chamber" });
            }

            if (!chamberId) {
                logger.info("chamber.handler: allocating new chamberId for socket %s", socket.id);
                chamberId = chamberService.allocateChamber();
            }

            if (!seerId) {
                logger.info("chamber.handler: allocating new seerId for socket %s", socket.id);
                // seerId = chamberService.generateSeerId(epithet);
                seerId = `${epithet}_${socket.id}`;
            }

            const registered = chamberService.registerSeer(chamberId, {
                seerId: seerId,
                socketId: socket.id,
                epithet: epithet,
                guise: guise,
            });

            if (!registered.ok) {
                logger.info(
                    "chamber.handler: failed to register seer %s in chamber %s: %s",
                    seerId,
                    chamberId,
                    registered.message
                );

                return cb && cb({ ok: false, message: registered.message });
            }

            socket.join(chamberId);
            socket.data.seerId = seerId;
            socket.data.chamberId = chamberId;

            logger.info("chamber.handler: player %s joined chamber %s", registered.seer?.socketId, chamberId);

            socketService.emitToChamber(chamberId, "chamber:sync", {
                chamberId: chamberId,
                seers: chamberService.retrieveSeers(chamberId),
            });

            return cb && cb({ ok: true, message: "joined chamber", chamberId: chamberId, seer: registered.seer, hasReachedQuorum: registered.hasReachedQuorum });
        })
    );

    socket.on(
        "chamber:leave",
        socketAsync((data: { chamberId: string; seerId: string }, cb: Function) => {
            const { chamberId, seerId } = data;
            const { deregistered, chamberDisposed } = chamberService.deregisterSeer(chamberId, seerId);

            if (!deregistered) {
                return cb && cb({ ok: false, message: "failed to leave chamber" });
            }

            socket.leave(chamberId);

            if (chamberDisposed) {
                logger.info("chamber.handler: last player %s left, disposed chamber %s", seerId, chamberId);
            } else {
                socketService.emitToChamber(chamberId, "chamber:sync", {
                    chamberId,
                    seers: chamberService.retrieveSeers(chamberId),
                });

                logger.info("chamber.handler: player %s left from chamber %s", seerId, chamberId);
            }

            return cb && cb({ ok: true, message: "left chamber" });
        })
    );

    socket.on(
        "disconnecting",
        socketAsync(() => {
            const { chamberId, seerId } = socket.data;

            if (!chamberId || !seerId) {
                return;
            }
            logger.info(`chamber.handler: cleanup for seer ${seerId} in chamber ${chamberId}`);

            const { deregistered, chamberDisposed, seer } = chamberService.deregisterSeer(chamberId, seerId);

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
        })
    );
}
