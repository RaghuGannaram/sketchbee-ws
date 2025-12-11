import chamberService from "./chamber.service";
import { summonProphecies } from "../game/prophecies";
import logger from "@src/configs/logger.config";
import { Rites } from "../types/ritual.types";
import { type IChamber, type ISeer } from "../types/chamber.types";

interface RitualOutcome {
    ok: boolean;
    message: string;
    chamberId: string;
    // Current State
    rite: Rites;
    currentCycle?: number;
    // Game Data (Visible to clients)
    seers?: ISeer[];
    casterId?: string;
    omen?: string; // The masked word (e.g., "_ _ _")
    // Secret Data (Only for Caster or Reveal)
    prophecies?: string[]; // Word options (only for Caster in DIVINATION)
    enigma?: string; // The actual word (only for REVELATION)
    // Timing Data
    timeLeftMs?: number;
    // Internal Control Data (Used by the Mutator, removed before return)
    _timerCallback?: () => void;
    _timerDurationMs?: number;
}

const ritualTimers = new Map<string, NodeJS.Timeout>();

function extinguishRitualTimer(chamberId: string): void {
    const timer = ritualTimers.get(chamberId);

    if (timer) {
        clearTimeout(timer);
        ritualTimers.delete(chamberId);
    }
}

function igniteRitualTimer(chamberId: string, durationMs: number, callback: () => void): number {
    extinguishRitualTimer(chamberId);

    const timer = setTimeout(() => {
        callback();
    }, durationMs);

    ritualTimers.set(chamberId, timer);
    return Date.now() + durationMs;
}

function transitionToDivination(chamber: IChamber): RitualOutcome {
    if ((chamber.currentCycle ?? 0) >= chamber.pact.maxCycles) {
        return transitionToDissolution(chamber);
    }

    const newCaster = chamber.seers[Math.floor(Math.random() * chamber.seers.length)];
    if (!newCaster) {
        throw new Error("Cannot select caster for new round: Insufficient seers.");
    }
    const prophecies = summonProphecies();

    const plannedState = {
        currentCycle: (chamber.currentCycle ?? 0) + 1,
        casterId: newCaster.seerId,
        prophecies: prophecies,
        unveiledSeers: [], // Reset unveiled seers for the round
        rite: Rites.DIVINATION,
    };

    // The timer's callback handles the fallback selection
    const timerCallback = () => {
        // Must call the public API to trigger state mutation and transition
        invokeRitualTransition(chamber.chamberId, (c) => transitionToManifestation(c, newCaster.seerId, prophecies[0]!, true));
    };

    return {
        ok: true,
        message: `Cycle ${plannedState.currentCycle}: Divination begins.`,
        chamberId: chamber.chamberId,
        seers: chamberService.retrieveSeers(chamber.chamberId), // Sync seers list
        // Game Essence
        // Side Effects
        _timerCallback: timerCallback,
        _timerDurationMs: chamber.pact.prophecyDurationMS,
        // State for mutation
        ...plannedState,
    };
}

/** DIVINATION -> MANIFESTATION (Caster has chosen word) */
function transitionToManifestation(chamber: IChamber, casterId: string, prophecy: string, isFallback: boolean = false): RitualOutcome {
    // 1. Core Logic: Mask the Enigma
    const omen = prophecy
        .split("")
        .map((char) => (char === " " ? " " : "_"))
        .join(" ");

    const plannedState = {
        enigma: prophecy,
        omen: omen,
        prophecies: [], // Clear options after choice
        rite: Rites.MANIFESTATION,
    };

    // 2. Timer Callback: Advance to Revelation when drawing time is up
    const timerCallback = () => invokeRitualTransition(chamber.chamberId, transitionToRevelation);

    return {
        ok: true,
        message: `Enigma manifested. Caster begins casting the Sigil. (Fallback: ${isFallback})`,
        chamberId: chamber.chamberId,
        // Game Essence
        casterId: casterId,
        currentCycle: chamber.currentCycle,
        // Side Effects
        _timerCallback: timerCallback,
        _timerDurationMs: chamber.pact.manifestationDurationMS,
        // State for mutation
        ...plannedState,
    };
}

function transitionToRevelation(chamber: IChamber): RitualOutcome {
    // 1. Scoring (Assumed utility in runeService)
    // runeService.tallyEssence(chamber.chamberId, chamber.enigma!, chamber.unveiledSeers);

    const plannedState = {
        rite: Rites.REVELATION,
    };

    // 2. Timer Callback: Advance to the next round or end the game
    const timerCallback = () => invokeRitualTransition(chamber.chamberId, transitionToDivination);

    return {
        ok: true,
        message: "Revelation: The true word is unveiled. Essence tallied.",
        chamberId: chamber.chamberId,
        // Game Essence
        enigma: chamber.enigma!, // Reveal the secret word
        seers: chamberService.retrieveSeers(chamber.chamberId), // Sync updated scores
        casterId: chamber.casterId!,
        currentCycle: chamber.currentCycle,
        // Side Effects
        _timerCallback: timerCallback,
        _timerDurationMs: chamber.pact.revealDurationMS,
        // State for mutation
        ...plannedState,
    };
}

function transitionToDissolution(chamber: IChamber): RitualOutcome {
    extinguishRitualTimer(chamber.chamberId);

    const seers = chamber.seers;
    chamberService.disposeChamber(chamber.chamberId);

    return {
        ok: true,
        message: "The Ritual is complete. The Chamber is dissolved.",
        chamberId: chamber.chamberId,
        rite: Rites.DISSOLUTION,
        seers: seers,
    };
}

// ====================================================================
// 🔨 STATE MUTATOR (The Central Controller)
// The function that applies calculated state changes and starts timers.
// ====================================================================

/**
 * Executes a pure transition function, handles state mutation, and manages side effects (timers).
 * This is the only place the chamber state is mutated and timers are set.
 */
function invokeRitualTransition(chamberId: string, transitionFunc: (chamber: IChamber, ...args: any[]) => RitualOutcome, ...args: any[]): RitualOutcome {
    const chamber = chamberService.retrieveChamber(chamberId);

    if (!chamber) {
        return { ok: false, message: "Chamber not found.", chamberId, rite: Rites.DISSOLUTION };
    }

    try {
        const outcome = transitionFunc(chamber, ...args);

        if (!outcome.ok) return outcome;

        // *** MUTATION: Apply all state changes derived from the pure function ***
        // This relies on the convention that IChamber properties are defined in the outcome.
        (Object.keys(outcome) as (keyof RitualOutcome)[]).forEach((key) => {
            if (chamber.hasOwnProperty(key) && outcome[key] !== undefined) {
                // Safely apply state changes to the persisted chamber object
                (chamber as any)[key] = outcome[key];
            }
        });

        // *** SIDE EFFECT: CONSECRATE TIMER ***
        if (outcome._timerCallback && outcome._timerDurationMs) {
            const deadline = igniteRitualTimer(chamberId, outcome._timerDurationMs, outcome._timerCallback);
            outcome.timeLeftMs = deadline - Date.now();
        }

        // Final cleanup for the return object
        delete outcome._timerCallback;
        delete outcome._timerDurationMs;

        return outcome;
    } catch (error: any) {
        logger.error(`Ritual transition error in chamber ${chamberId}: ${error.message}`);

        extinguishRitualTimer(chamberId);

        return { ok: false, message: `Engine failure: ${error.message}`, chamberId, rite: chamber.rite };
    }
}

// ====================================================================
// 📯 PUBLIC API (The Entry Points)
// This is what the Handlers and internal timers call.
// ====================================================================

/**
 * Initiates the ritual or advances it based on the server's internal clock/state.
 * This is the main Game Loop entry point.
 */
export function advanceRitual(chamberId: string): RitualOutcome {
    const chamber = chamberService.retrieveChamber(chamberId);

    if (!chamber) {
        return { ok: false, message: "Chamber not found.", chamberId, rite: Rites.DISSOLUTION };
    }

    switch (chamber.rite) {
        case Rites.CONSECRATION:
        case Rites.REVELATION:
            return invokeRitualTransition(chamberId, transitionToDivination);

        case Rites.MANIFESTATION:
            return invokeRitualTransition(chamberId, transitionToRevelation);

        case Rites.DIVINATION:
            return { ok: false, message: "Engine already awaiting Caster selection.", chamberId, rite: chamber.rite };

        case Rites.DISSOLUTION:
            return { ok: false, message: "Ritual complete. Chamber dissolved.", chamberId, rite: chamber.rite };

        default:
            return { ok: false, message: `Invalid rite: ${chamber.rite}`, chamberId, rite: chamber.rite };
    }
}

export function sealProphecy(chamberId: string, casterId: string, prophecy: string, isFallback: boolean = false): RitualOutcome {
    const chamber = chamberService.retrieveChamber(chamberId);

    if (!chamber) {
        return { ok: false, message: "Chamber not found.", chamberId, rite: Rites.DISSOLUTION };
    }

    if (chamber.rite !== Rites.DIVINATION) {
        return { ok: false, message: "Not in DIVINATION rite.", chamberId, rite: chamber.rite };
    }

    if (chamber.casterId !== casterId) {
        return { ok: false, message: " Unauthorized prophecy sealing attempt.", chamberId, rite: chamber.rite };
    }

    return invokeRitualTransition(chamberId, transitionToManifestation, casterId, prophecy, isFallback);
}

export function concludeManifestationEarly(chamberId: string): RitualOutcome {
    const chamber = chamberService.retrieveChamber(chamberId);

    if (!chamber) {
        return { ok: false, message: "Chamber not found.", chamberId, rite: Rites.DISSOLUTION };
    }

    if (chamber.rite !== Rites.MANIFESTATION) {
        return { ok: false, message: "Not in MANIFESTATION rite.", chamberId, rite: chamber.rite };
    }

    return invokeRitualTransition(chamberId, transitionToRevelation);
}

export default {
    advanceRitual,
    sealProphecy,
    concludeManifestationEarly,
    extinguishRitualTimer,
};
