type Player = { socketId: string; userId: string; name: string };

type Room = {
    players: Map<string, Player>;
    drawerId: string | null;
    word: string | null;
    started: boolean;
    createdAt: number;
};

const rooms = new Map<string, Room>();
const MAX_PLAYERS_PER_ROOM = 10;

function findOrCreateRoom(): string {
    for (const [roomId, room] of rooms.entries()) {
        if (room.players.size < MAX_PLAYERS_PER_ROOM && !room.started) return roomId;
    }
    const id = `room_${Date.now()}_${Math.floor(Math.random() * 9000)}`;
    rooms.set(id, { players: new Map(), drawerId: null, word: null, started: false, createdAt: Date.now() });
    return id;
}

function getRoom(roomId: string) {
    return rooms.get(roomId) || null;
}

function addPlayer(roomId: string, socketId: string, opts: { userId: string; name: string }) {
    const room = rooms.get(roomId);
    if (!room) return false;
    room.players.set(socketId, { socketId, userId: opts.userId, name: opts.name });
    return true;
}

function removePlayer(roomId: string, socketId: string) {
    const room = rooms.get(roomId);
    if (!room) return false;
    room.players.delete(socketId);
    if (room.players.size === 0) rooms.delete(roomId);
    return true;
}

function getPlayersList(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return [] as Player[];
    return Array.from(room.players.values()).map((p) => ({ userId: p.userId, name: p.name, socketId: p.socketId }));
}

function listRoomsSnapshot() {
    return Array.from(rooms.entries()).map(([id, r]) => ({ id, players: r.players.size, createdAt: r.createdAt }));
}

export default {
    findOrCreateRoom,
    getRoom,
    addPlayer,
    removePlayer,
    getPlayersList,
    listRoomsSnapshot,
    MAX_PLAYERS_PER_ROOM,
};
