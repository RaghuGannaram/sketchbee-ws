import type { ISigil } from "./rune.types";
import { RitualPhase } from "./ritual.types";

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
    phase: RitualPhase;

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
        manifestationDurationMS: number;
        revealDurationMS: number;
    };

    manifestedAt: number;
}
