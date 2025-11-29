export enum ChamberStatus {
    WAITING = "WAITING",
    PLAYING = "PLAYING",
}

export interface IStroke {
    color: string;
    width: number;
    points: { x: number; y: number }[];
}

export interface IPlayer {
    playerId: string;
    socketId: string;
    handle: string;
    avatar: string;
    score: number;

    isDrawer: boolean;
    hasGuessedCorrectly: boolean;
    scoreThisRound: number;
}

export interface IChamber {
    chamberId: string;
    players: IPlayer[];
    status: ChamberStatus;

    currentDrawerId: string | null;
    currentWord: string | null; // Secret: "Apple"
    currentHint: string | null; // Public: "_ _ _ _ _"
    wordChoices: string[]; // Words offered to drawer

    roundEndTime: number;
    strokeHistory: IStroke[];

    config: {
        maxPlayers: number;
        roundTimeMS: number;
        totalRounds: number;
    };

    createdAt: number;
}
