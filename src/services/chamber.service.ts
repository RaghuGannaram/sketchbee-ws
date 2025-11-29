import { ChamberStatus, type IChamber, type IPlayer } from "@src/types/chamber.types";

const CHAMBER_CONFIG = {
    DEFAULT_MAX_PLAYERS: 8,
    DEFAULT_ROUND_TIME: 60000,
};

const chambers = new Map<string, IChamber>();

function persistChamber(chamber: IChamber) {
    chambers.set(chamber.chamberId, chamber);
}

function retrieveChamber(chamberId: string): IChamber | null {
    return chambers.get(chamberId) || null;
}

function retrieveChambers(): IChamber[] {
    return Array.from(chambers.values());
}

function disposeChamber(chamberId: string) {
    chambers.delete(chamberId);
}

function allocateChamber(): string {
    for (const chamber of retrieveChambers()) {
        if (chamber.players.length < chamber.config.maxPlayers) {
            return chamber.chamberId;
        }
    }
    return provisionChamber();
}

function provisionChamber(): string {
    const chamberId = `chamber_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;

    const newChamber: IChamber = {
        chamberId,
        players: [],
        status: ChamberStatus.WAITING,
        currentDrawerId: null,
        currentWord: null,
        currentHint: null,
        wordChoices: [],
        roundEndTime: 0,
        strokeHistory: [],
        createdAt: Date.now(),
        config: {
            maxPlayers: CHAMBER_CONFIG.DEFAULT_MAX_PLAYERS,
            roundTimeMS: CHAMBER_CONFIG.DEFAULT_ROUND_TIME,
            totalRounds: 3,
        },
    };

    persistChamber(newChamber);
    return chamberId;
}

function registerPlayer(
    chamberId: string,
    profile: { playerId: string; socketId: string; handle: string; avatar?: string }
): { ok: boolean; message?: string; player: IPlayer | null } {
    const chamber = retrieveChamber(chamberId);

    if (!chamber) {
        return { ok: false, player: null, message: "chamber not found" };
    }

    const existingIndex = chamber.players.findIndex((p) => p.socketId === profile.socketId);

    if (existingIndex === -1 && chamber.players.length >= chamber.config.maxPlayers) {
        return { ok: false, player: null, message: "chamber is full" };
    }

    const existingData = existingIndex !== -1 ? chamber.players[existingIndex] : null;

    const player: IPlayer = {
        playerId: profile.playerId,
        socketId: profile.socketId,
        handle: profile.handle,
        avatar: profile.avatar || "",
        score: existingData ? existingData.score : 0,
        isDrawer: false,
        hasGuessedCorrectly: false,
        scoreThisRound: 0,
    };

    if (existingIndex !== -1) {
        chamber.players[existingIndex] = player;

        return { ok: true, player, message: "player re-registered" };
    } else {
        chamber.players.push(player);

        return { ok: true, player, message: "player registered" };
    }
}

function deregisterPlayer(
    chamberId: string,
    socketId: string
): { deregistered: boolean; chamberDisposed: boolean; player: IPlayer | null } {
    const chamber = retrieveChamber(chamberId);

    if (!chamber) {
        return { deregistered: false, chamberDisposed: false, player: null };
    }

    const player = chamber.players.find((p) => p.socketId === socketId);

    if (!player) {
        return { deregistered: false, chamberDisposed: false, player: null };
    }

    chamber.players = chamber.players.filter((p) => p.socketId !== socketId);

    if (chamber.players.length === 0) {
        disposeChamber(chamberId);

        return { deregistered: true, chamberDisposed: true, player };
    }

    return { deregistered: true, chamberDisposed: false, player };
}

function retrievePlayers(chamberId: string): IPlayer[] {
    const chamber = retrieveChamber(chamberId);

    if (!chamber) return [];

    return Array.from(chamber.players.values());
}

export default {
    allocateChamber,
    retrieveChamber,
    retrieveChambers,
    registerPlayer,
    deregisterPlayer,
    retrievePlayers,
};
