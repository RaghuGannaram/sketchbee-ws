import { Socket, Server } from "socket.io";
import logger from "@src/configs/logger.config";
import socketService from "@src/services/socket.service";
import roomService from "@src/services/chamber.service";

export function handleConnection(socket: Socket, io: Server) {
    // ensure services have io
    socketService.setIO(io);

    logger.debug("connection.handler: client connected %s", socket.id);

    socket.on("greet", (data, cb) => {
        try {
            logger.debug("connection.handler: Greetings from %s : %o", socket.id, data);

            cb({
                greeting: `Hello ${socket.id}..!`,
                serverTime: Date.now(),
            });
        } catch (err) {
            logger.error("connection.handler: greet error %o", err);

            cb({ error: "Failed to process greeting" });
        }
    });

    socket.on("online", (data) => {
        try {
            if (data?.chatId) socket.join(data.chatId);
            logger.debug("connection.handler: user online %o", data?.user?.handle || data);
        } catch (err) {
            logger.error("connection.handler: online handler error %o", err);
        }
    });

    socket.on("join_room", ({ roomId, userId, name }, cb) => {
        try {
            const targetRoom = roomId || roomService.findOrCreateRoom();
            const room = roomService.getRoom(targetRoom);
            if (!room) return cb && cb({ ok: false, message: "room not found" });
            if (room.players.size >= roomService.MAX_PLAYERS_PER_ROOM)
                return cb && cb({ ok: false, message: "room full" });

            socket.join(targetRoom);
            roomService.addPlayer(targetRoom, socket.id, { userId: userId || socket.id, name: name || "Anon" });

            const players = roomService.getPlayersList(targetRoom);
            io.to(targetRoom).emit("room_update", { roomId: targetRoom, players });
            cb && cb({ ok: true, roomId: targetRoom, players });
            logger.debug("connection.handler: socket %s joined %s", socket.id, targetRoom);
        } catch (err) {
            logger.error("connection.handler: join_room error %o", err);
            cb && cb({ ok: false, message: "join failed" });
        }
    });

    socket.on("leave_room", ({ roomId }) => {
        try {
            roomService.removePlayer(roomId, socket.id);
            socket.leave(roomId);
            io.to(roomId).emit("room_update", { roomId, players: roomService.getPlayersList(roomId) });
        } catch (err) {
            logger.error("connection.handler: leave_room error %o", err);
        }
    });

    socket.on("chat_message", ({ roomId, userId, name, text }) => {
        try {
            if (typeof text !== "string" || text.length > 500) return;
            const payload = { userId, name, text, ts: Date.now() };
            io.to(roomId).emit("chat_message", payload);
        } catch (err) {
            logger.error("connection.handler: chat_message error %o", err);
        }
    });

    socket.on("strokes_batch", ({ roomId, strokes }) => {
        try {
            if (!Array.isArray(strokes) || strokes.length === 0) return;
            socket.to(roomId).emit("strokes_batch", { strokes, from: socket.id });
        } catch (err) {
            logger.error("connection.handler: strokes_batch error %o", err);
        }
    });

    socket.on("clear_canvas", ({ roomId }) => {
        try {
            io.to(roomId).emit("clear_canvas", { roomId, by: socket.id, ts: Date.now() });
        } catch (err) {
            logger.error("connection.handler: clear_canvas error %o", err);
        }
    });

    socket.on("list_rooms", (cb) => {
        try {
            cb && cb(roomService.listRoomsSnapshot());
        } catch (err) {
            logger.error("connection.handler: list_rooms error %o", err);
        }
    });

    socket.on("disconnecting", () => {
        try {
            const joined = Array.from(socket.rooms).filter((r) => r !== socket.id);
            for (const roomId of joined) {
                roomService.removePlayer(roomId, socket.id);
                io.to(roomId).emit("room_update", { roomId, players: roomService.getPlayersList(roomId) });
            }
            logger.debug("connection.handler: disconnecting %s", socket.id);
        } catch (err) {
            logger.error("connection.handler: disconnecting error %o", err);
        }
    });
}
