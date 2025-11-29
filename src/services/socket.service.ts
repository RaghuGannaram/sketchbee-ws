import { Server } from "socket.io";
import logger from "@src/configs/logger.config";

let _io: Server | null = null;

function initIO(io: Server) {
    if (_io) {
        logger.warn("socket.service: Attempted to initialize IO more than once.");
        return;
    }
    _io = io;
    logger.info("socket.service: IO instance initialized.");
}

function getIO(): Server {
    if (!_io) {
        logger.error("socket.service: IO instance requested before initialization.");

        throw new Error("socket.service: IO not initialized. Call init(io) first.");
    }
    return _io;
}

function emitToChamber(chamberId: string, eventName: string, payload: any) {
    getIO().to(chamberId).emit(eventName, payload);
}

function emitToSocket(socketId: string, eventName: string, payload: any) {
    getIO().to(socketId).emit(eventName, payload);
}

function broadcastToChamberExcept(chamberId: string, excludedSocketId: string, eventName: string, payload: any) {
    getIO().to(chamberId).except(excludedSocketId).emit(eventName, payload);
}

function broadcastGlobal(eventName: string, payload: any) {
    getIO().emit(eventName, payload);
}

function makeSocketJoin(socketId: string, chamberId: string) {
    const socket = getIO().sockets.sockets.get(socketId);
    if (socket) {
        socket.join(chamberId);
    }
}

function makeSocketLeave(socketId: string, chamberId: string) {
    const socket = getIO().sockets.sockets.get(socketId);
    if (socket) {
        socket.leave(chamberId);
    }
}

function getChamberSize(chamberId: string): number {
    const chamber = getIO().sockets.adapter.rooms.get(chamberId);
    return chamber ? chamber.size : 0;
}

function getSocketsInChamber(chamberId: string): string[] {
    const chamber = getIO().sockets.adapter.rooms.get(chamberId);
    return chamber ? Array.from(chamber) : [];
}

function isSocketConnected(socketId: string): boolean {
    return getIO().sockets.sockets.has(socketId);
}

export default {
    initIO,
    getIO,
    // Emitters
    emitToChamber,
    emitToSocket,
    broadcastToChamberExcept,
    broadcastGlobal,
    // Actions
    makeSocketJoin,
    makeSocketLeave,
    // Inspection
    getChamberSize,
    getSocketsInChamber,
    isSocketConnected,
};
