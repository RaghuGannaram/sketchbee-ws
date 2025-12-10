import type { ISigil } from "./rune.types";
import { Rites } from "./ritual.types";

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
    unvailedSeers: string[];
    pact: {
        quorum: number;
        plenum: number;
        maxCycles: number;

        prophecyDurationMS: number;
        manifestationDurationMS: number;
        revealDurationMS: number;
    };

    consecratedAt: number;
}
