import { Server } from "socket.io";

let ioInstance: Server | null = null;

function setIO(io: Server) {
    ioInstance = io;
}

function getIO(): Server | null {
    return ioInstance;
}

function emitToRoom(roomId: string, event: string, payload: any) {
    ioInstance?.to(roomId).emit(event, payload);
}

function emitToSocket(socketId: string, event: string, payload: any) {
    ioInstance?.to(socketId).emit(event, payload);
}

function broadcastToRoomExcept(roomId: string, socketId: string, event: string, payload: any) {
    // socket.io v4 supports except on Server-side; using safe approach
    const room = ioInstance?.sockets.adapter.rooms.get(roomId);
    if (!room || !ioInstance) return;
    for (const sid of room) {
        if (sid === socketId) continue;
        ioInstance.to(sid).emit(event, payload);
    }
}

export default {
    setIO,
    getIO,
    emitToRoom,
    emitToSocket,
    broadcastToRoomExcept,
};
