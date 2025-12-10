import chamberService from "./chamber.service";
import { summonProphecies } from "@src/game/prophecies";
import type { ISeer } from "@src/types";
import { Rites } from "@src/types/ritual.types";

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
        seer.currentEssence = 0;
    });

    chamber.casterId = newCaster.seerId;
    chamber.prophecies = summonProphecies();
    chamber.omen = null;
    chamber.enigma = null;
    chamber.sigilHistory = [];
    chamber.rite = Rites.DIVINATION;

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
    chamber.rite = Rites.MANIFESTATION;

    return { ok: true, message: "enigma manifested", omen: omen };
}

/**
 * Prepare data for the client (Sanitize secrets)
 * (Formerly: getGameState)
 */
function perceiveRitual(chamberId: string, requestingSeerId: string) {
    const chamber = chamberService.retrieveChamber(chamberId);
    if (!chamber) return null;

    const requestingSeer = chamber.seers.find((s) => s.seerId === requestingSeerId);

    // RETURN SAFE DATA (Hide the Enigma)
    return {
        ...chamber,
        // The Enigma is hidden unless the round is over
        enigma: null,

        // Prophecies are hidden unless you are the Caster
        prophecies: true ? chamber.prophecies : [],
    };
}

export default {
    prepareRitual,
    manifestEnigma,
    perceiveRitual,  
};
