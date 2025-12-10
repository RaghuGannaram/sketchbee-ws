import chamberService from "./chamber.service";
import { Rites } from "@src/types/ritual.types";
import { type IChamber } from "@src/types/chamber.types";

function castSigil(chamberId: string, sigil: any) {
    const chamber = chamberService.retrieveChamber(chamberId);

    if (chamber && chamber.rite === Rites.MANIFESTATION) {
        chamber.sigilHistory.push(sigil);
    }
}

function banishSigils(chamberId: string) {
    const chamber = chamberService.retrieveChamber(chamberId);
    if (chamber) chamber.sigilHistory = [];
}

function attemptDecipher(
    chamberId: string,
    seerId: string,
    script: string
): {
    ok: boolean;
    message: string;
} {
    const chamber = chamberService.retrieveChamber(chamberId);

    if (!chamber || !chamber.enigma || chamber.rite !== Rites.MANIFESTATION) {
        return { ok: false, message: script };
    }

    const seer = chamber.seers.find((seer) => seer.seerId === seerId);
    if (!seer) return { ok: false, message: script };

    if (chamber.casterId === seerId && chamber.unvailedSeers.includes(seerId)) {
        return { ok: true, message: "You have already unveiled the truth" };
    }

    const cleanScript = script.trim().toLowerCase();
    const secretTruth = chamber.enigma.toLowerCase();

    if (cleanScript === secretTruth) {
        chamber.unvailedSeers.push(seerId);

        return { ok: true, message: `${seer.epithet} cracked the enigma ...!` };
    }

    const isClose = secretTruth.includes(cleanScript) && Math.abs(secretTruth.length - cleanScript.length) < 2;

    if (isClose) {
        return { ok: false, message: `'${script}' is close to the truth!` };
    }

    return { ok: false, message: script };
}

/**
 * Internal Helper: Checks if the round should end early
 * (Formerly checkIfRoundShouldEnd)
 */
// function assessRitualState(chamber: IChamber) {
//     // If all non-Casters have unveiled the Enigma
//     const guessers = chamber.seers.filter((p) => !p.isCaster);
//     const allUnveiled = guessers.every((p) => p.hasUnveiled);

//     if (allUnveiled && guessers.length > 0) {
//         // Move immediately to Revelation
//         chamber.phase = RitualPhase.REVELATION;
//         // Short buffer (e.g., 5 seconds) to see scores before next round
//     }
// }

// ==========================================
// DATA PROJECTION (Sanitizing)
// ==========================================

// function perceiveRitual(chamberId: string, requestingSeerId: string) {
//     const chamber = chamberService.retrieveChamber(chamberId);
//     if (!chamber) return null;

//     const requestingSeer = chamber.seers.find((s) => s.seerId === requestingSeerId);
//     const isCaster = requestingSeer?.isCaster ?? false;

//     // RETURN SAFE DATA
//     return {
//         ...chamber,
//         // Hide Enigma unless we are in the REVEALING phase
//         enigma: chamber.phase === RitualPhase.REVELATION ? chamber.enigma : null,

//         // Hide Prophecies unless you are the Caster
//         prophecies: isCaster ? chamber.prophecies : [],
//     };
// }

export default {
    castSigil,
    banishSigils,
    attemptDecipher,
    // perceiveRitual,
};
