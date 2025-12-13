import { type ISigil } from "@src/types/rune.types";

export enum Rites {
    CONGREGATION = "CONGREGATION",
    CONSECRATION = "CONSECRATION",
    DIVINATION = "DIVINATION",
    MANIFESTATION = "MANIFESTATION",
    REVELATION = "REVELATION",
    DISSOLUTION = "DISSOLUTION",
}

export interface ISeer {
    seerId: string;
    socketId: string;
    chamberId?: string;

    epithet: string;
    guise: string;

    essence: number;
    currentEssence: number;
}

export interface IChamber {
    chamberId: string;
    seers: ISeer[];
    rite: Rites;

    casterId: string | null;
    prophecies: string[];
    omen: string | null;
    enigma: string | null;

    sigilHistory: ISigil[];
    unveiledSeers: string[];
    currentCycle: number;
    pact: {
        quorum: number;
        plenum: number;
        maxCycles: number;

        consecrationDurationMS: number;
        divinationDurationMS: number;
        manifestationDurationMS: number;
        revealDurationMS: number;
    };

    consecratedAt: number;
}
