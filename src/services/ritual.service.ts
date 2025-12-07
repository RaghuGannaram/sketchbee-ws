import chamberService from "./chamber.service";
import { summonProphecies } from "@src/game/prophecies";
import type { ISeer } from "@src/types";
import { RitualPhase } from "@src/types/ritual.types";

interface DecipherResult {
    outcome: "UNVEILED" | "CLOSE" | "DISCORD" | "ALREADY_UNVEILED";
    essenceGained: number;
    message: string;
}

function prepareRitual(chamberId: string): { ok: boolean; message: string; caster: ISeer | null } {
    const chamber = chamberService.retrieveChamber(chamberId);

    if (!chamber) return { ok: false, message: "chamber not found", caster: null };

    const randomCasterIndex = Math.floor(Math.random() * chamber.seers.length);
    const newCaster = chamber.seers[randomCasterIndex] as ISeer;

    chamber.seers.forEach((seer) => {
        seer.isCaster = seer.seerId === newCaster.seerId;
        seer.hasUnveiled = false;
        seer.currentEssence = 0;
    });

    chamber.casterId = newCaster.seerId;
    chamber.prophecies = summonProphecies();
    chamber.omen = null;
    chamber.enigma = null;
    chamber.sigilHistory = [];
    chamber.phase = RitualPhase.DIVINATION;

    return { ok: true, message: "ritual prepared", caster: newCaster };
}

function manifestEnigma(
    chamberId: string,
    casterId: string,
    prophecy: string
): { ok: boolean; message: string; omen: string | null } {
    const chamber = chamberService.retrieveChamber(chamberId);

    if (!chamber) {
        return { ok: false, message: "chamber not found", omen: null };
    }

    if (chamber.casterId !== casterId) {
        return { ok: false, message: "only the caster can manifest the enigma", omen: null };
    }

    const omen = prophecy
        .split("")
        .map((char) => (char === " " ? " " : "_"))
        .join(" ");

    chamber.enigma = prophecy;
    chamber.omen = omen;
    chamber.prophecies = [];
    chamber.phase = RitualPhase.MANIFESTATION;

    return { ok: true, message: "enigma manifested", omen: omen };
}

function attemptDecipher(chamberId: string, seerId: string, script: string): DecipherResult {
    const chamber = chamberService.retrieveChamber(chamberId);

    // Validation: Ritual must be active and Enigma must exist
    if (!chamber || !chamber.enigma || chamber.phase !== RitualPhase.MANIFESTATION) {
        return { outcome: "DISCORD", essenceGained: 0, message: script };
    }

    const seer = chamber.seers.find((s) => s.seerId === seerId);
    if (!seer) return { outcome: "DISCORD", essenceGained: 0, message: script };

    // 1. Check if eligible (Caster cannot guess, Seer cannot guess twice)
    if (seer.hasUnveiled || seer.isCaster) {
        return { outcome: "ALREADY_UNVEILED", essenceGained: 0, message: script };
    }

    const cleanScript = script.trim().toLowerCase();
    const secretTruth = chamber.enigma.toLowerCase();

    // 2. Check Match (UNVEILED)
    if (cleanScript === secretTruth) {
        // ESSENCE CALCULATION (Scoring)
        // Max 100 Essence, draining as Flux decreases
        const baseEssence = 100;
        // Simple logic: Assuming linear decay or fixed for now
        // In a real app, calculate based on (chamber.fluxExpiry - Date.now())
        const essenceAwarded = Math.floor(baseEssence * 0.8);

        // Grant Essence to Seer
        seer.essence += essenceAwarded;
        seer.currentEssence = essenceAwarded;
        seer.hasUnveiled = true;

        // Grant Essence to the Caster (Reward them for a good drawing)
        const caster = chamber.seers.find((s) => s.seerId === chamber.casterId);
        if (caster) {
            caster.essence += 15;
            caster.currentEssence += 15; // Accumulate round score
        }

        // Check if the Ritual Cycle should end (All Seers have unveiled?)
        // checkIfCycleComplete(chamber); // Dependency placeholder

        return {
            outcome: "UNVEILED",
            essenceGained: essenceAwarded,
            message: `${seer.epithet} cracked the enigma ...!`,
        };
    }

    // 3. Check "Close" (Levenshtein or substring)
    // "The Seer is seeing a partial vision..."
    const isClose = secretTruth.includes(cleanScript) && Math.abs(secretTruth.length - cleanScript.length) < 2;

    if (isClose) {
        return { outcome: "CLOSE", essenceGained: 0, message: `'${script}' is close to the truth!` };
    }

    // 4. Wrong (DISCORD)
    return { outcome: "DISCORD", essenceGained: 0, message: script };
}

/**
 * Prepare data for the client (Sanitize secrets)
 * (Formerly: getGameState)
 */
function perceiveRitual(chamberId: string, requestingSeerId: string) {
    const chamber = chamberService.retrieveChamber(chamberId);
    if (!chamber) return null;

    const requestingSeer = chamber.seers.find((s) => s.seerId === requestingSeerId);
    const isCaster = requestingSeer?.isCaster ?? false;

    // RETURN SAFE DATA (Hide the Enigma)
    return {
        ...chamber,
        // The Enigma is hidden unless the round is over
        enigma: null,

        // Prophecies are hidden unless you are the Caster
        prophecies: isCaster ? chamber.prophecies : [],
    };
}

export default {
    prepareRitual,
    manifestEnigma,
    attemptDecipher,
    perceiveRitual,
};
