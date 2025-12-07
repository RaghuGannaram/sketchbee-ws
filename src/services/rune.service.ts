import chamberService from "./chamber.service";
import { type IChamber } from "@src/types/chamber.types";
import { RitualPhase } from "@src/types/ritual.types";

interface DecipherResult {
    ok: boolean;
    outcome: "UNVEILED" | "CLOSE" | "DISCORD" | "ALREADY_UNVEILED" | "IGNORE";
    essenceGained: number;
    message: string;
}

// ==========================================
// RUNE MANIPULATION (Drawing)
// ==========================================

function castSigil(chamberId: string, sigil: any) {
    const chamber = chamberService.retrieveChamber(chamberId);

    // Can only draw during the MANIFESTING phase
    if (chamber && chamber.phase === RitualPhase.MANIFESTATION) {
        chamber.sigilHistory.push(sigil);
    }
}

function banishSigils(chamberId: string) {
    const chamber = chamberService.retrieveChamber(chamberId);
    if (chamber) chamber.sigilHistory = [];
}

function attemptDecipher(chamberId: string, seerId: string, script: string): DecipherResult {
    const chamber = chamberService.retrieveChamber(chamberId);

    // Validation: Ritual must be active and Enigma must exist
    if (!chamber || !chamber.enigma || chamber.phase !== RitualPhase.MANIFESTATION) {
        return { ok: false, outcome: "IGNORE", essenceGained: 0, message: script };
    }

    const seer = chamber.seers.find((s) => s.seerId === seerId);
    if (!seer) return { ok: false, outcome: "IGNORE", essenceGained: 0, message: script };

    // 1. Check if eligible (Caster cannot guess, Seer cannot guess twice)
    if (seer.hasUnveiled || seer.isCaster) {
        return { ok: false, outcome: "ALREADY_UNVEILED", essenceGained: 0, message: script };
    }

    const cleanScript = script.trim().toLowerCase();
    const secretTruth = chamber.enigma.toLowerCase();

    // 2. Check Match (UNVEILED)
    if (cleanScript === secretTruth) {
        // ESSENCE CALCULATION
        // Max 100 Essence, drains based on time elapsed

        // Base 50 + up to 50 bonus for speed

        // Grant Essence to Seer
        seer.hasUnveiled = true;

        // Grant Essence to the Caster (Reward them for being understood)
        const caster = chamber.seers.find((s) => s.seerId === chamber.casterId);
        if (caster) {
            const casterBonus = 15;
            caster.essence += casterBonus;
            caster.currentEssence += casterBonus;
        }

        // Check if everyone has guessed
        assessRitualState(chamber);

        return { ok: true, outcome: "UNVEILED", essenceGained: 0, message: `${seer.epithet} cracked the enigma ...!`};
    }

    // 3. Check "Close"
    const isClose = secretTruth.includes(cleanScript) && Math.abs(secretTruth.length - cleanScript.length) < 2;
    if (isClose) {
        return { ok: false, outcome: "CLOSE", essenceGained: 0, message: `'${script}' is close to the truth!` };
    }

    // 4. Wrong (DISCORD)
    return { ok: false, outcome: "DISCORD", essenceGained: 0, message: script };
}

/**
 * Internal Helper: Checks if the round should end early
 * (Formerly checkIfRoundShouldEnd)
 */
function assessRitualState(chamber: IChamber) {
    // If all non-Casters have unveiled the Enigma
    const guessers = chamber.seers.filter((p) => !p.isCaster);
    const allUnveiled = guessers.every((p) => p.hasUnveiled);

    if (allUnveiled && guessers.length > 0) {
        // Move immediately to Revelation
        chamber.phase = RitualPhase.REVELATION;
        // Short buffer (e.g., 5 seconds) to see scores before next round
    }
}

// ==========================================
// DATA PROJECTION (Sanitizing)
// ==========================================

function perceiveRitual(chamberId: string, requestingSeerId: string) {
    const chamber = chamberService.retrieveChamber(chamberId);
    if (!chamber) return null;

    const requestingSeer = chamber.seers.find((s) => s.seerId === requestingSeerId);
    const isCaster = requestingSeer?.isCaster ?? false;

    // RETURN SAFE DATA
    return {
        ...chamber,
        // Hide Enigma unless we are in the REVEALING phase
        enigma: chamber.phase === RitualPhase.REVELATION ? chamber.enigma : null,

        // Hide Prophecies unless you are the Caster
        prophecies: isCaster ? chamber.prophecies : [],
    };
}

export default {
    castSigil,
    banishSigils,
    attemptDecipher,
    perceiveRitual,
};
