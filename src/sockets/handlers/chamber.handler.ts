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

export default function registerChamberHandlers(socket: Socket) {
    socket.on(
        "sys:greet",
        socketAsync((data: any, cb: Function) => {
            logger.debug("chamber.handler: %s greets, %s", socket.id, data?.greeting);

            if (cb) cb({ ok: true, greeting: `Hello ${socket.id}`, serverTime: Date.now() });
        })
    );

    socket.on(
        "sys:online",
        socketAsync((data: any, cb: Function) => {
            logger.debug("chamber.handler: %s is online with data: %o", socket.id, data);

            if (cb) cb({ ok: true, serverTime: Date.now() });
        })
    );

    socket.on(
        "chamber:join",
        socketAsync(
            (
                { chamberId, playerId, handle }: { chamberId: string; playerId: string; handle: string },
                cb: Function
            ) => {
                const targetChamberId = chamberId || chamberService.allocateChamber();
                const targetChamber = chamberService.retrieveChamber(targetChamberId);

                if (!targetChamber) {
                    return cb && cb({ ok: false, message: "chamber not found" });
                }

                if (targetChamber.players.size >= targetChamber.config.maxPlayers) {
                    return cb && cb({ ok: false, message: "chamber is full" });
                }

                socket.join(targetChamberId);

                const registered = chamberService.registerPlayer(targetChamberId, {
                    playerId: playerId || `player_${socket.id}`,
                    socketId: socket.id,
                    handle: handle || "Anon",
                });

                if (!registered.ok) {
                    return cb && cb({ ok: false, message: "failed to join chamber" });
                }

                socketService.emitToChamber(targetChamberId, "chamber:sync", {
                    chamberId: targetChamberId,
                    players: chamberService.retrievePlayers(targetChamberId),
                });

                logger.info(
                    "chamber.handler: player %s joined chamber %s",
                    registered.player?.socketId,
                    targetChamberId
                );

                return (
                    cb &&
                    cb({ ok: true, message: "joined chamber", chamberId: targetChamberId, player: registered.player })
                );
            }
        )
    );

    socket.on(
        "chamber:leave",
        socketAsync(({ chamberId }: { chamberId: string }, cb: Function) => {
            const { deregistered, chamberDisposed, player } = chamberService.deregisterPlayer(chamberId, socket.id);

            if (!deregistered) {
                return cb && cb({ ok: false, message: "failed to leave chamber" });
            }

            socket.leave(chamberId);

            socketService.emitToChamber(chamberId, "chamber:sync", {
                chamberId,
                players: chamberService.retrievePlayers(chamberId),
            });

            if (chamberDisposed) {
                logger.info("chamber.handler: last player %s left, disposed chamber %s", player?.socketId, chamberId);
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

                const { deregistered, chamberDisposed, player } = chamberService.deregisterPlayer(chamberId, socket.id);

                if (deregistered && !chamberDisposed) {
                    socketService.emitToChamber(chamberId, "chamber:sync", {
                        chamberId,
                        players: chamberService.retrievePlayers(chamberId),
                    });

                    socketService.emitToChamber(chamberId, "sys:message", {
                        text: player?.isDrawer
                            ? `${player?.handle} (drawer) has disconnected.`
                            : `${player?.handle} has disconnected.`,
                    });
                }
            }
        })
    );
}
