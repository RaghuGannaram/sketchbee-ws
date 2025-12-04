import type { ISigil } from "./rune.types";

export enum ChamberPhase {
    GATHERING = "GATHERING",
    INVOKING = "INVOKING",
    MANIFESTING = "MANIFESTING",
    REVEALING = "REVEALING",
    SEALED = "SEALED",
}

export interface ISeer {
    seerId: string;
    socketId: string;
    chamberId?: string;

    epithet: string;
    guise: string;

    essence: number;

    isCaster: boolean;
    hasUnveiled: boolean;
    currentEssence: number;
}

export interface IChamber {
    chamberId: string;
    seers: ISeer[];
    phase: ChamberPhase;

    casterId: string | null;
    prophecies: string[];
    omen: string | null;
    enigma: string | null;

    sigilHistory: ISigil[];

    pact: {
        quorum: number;
        plenum: number;
        maxCycles: number;

        prophecyDurationMS: number;
        fluxDurationMS: number;
        revealDurationMS: number;
    };

    manifestedAt: number;
}
