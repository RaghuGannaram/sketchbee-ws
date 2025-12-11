import { Rites } from "@src/types/ritual.types";
import type { IChamber } from "@src/types";

export enum Resonance {
    UNVEILED = "UNVEILED",
    GLIMPSE = "GLIMPSE",
    SCRIPT = "SCRIPT",
    SILENCE = "SILENCE",
}

export interface IInterpretation {
    resonance: Resonance;
    message: string;
}

function decipherEnigma(chamber: IChamber, seerId: string, script: string): IInterpretation {
    if (!chamber.enigma || chamber.rite !== Rites.MANIFESTATION) {
        return { resonance: Resonance.SCRIPT, message: script };
    }

    if (chamber.casterId === seerId || chamber.unveiledSeers.includes(seerId)) {
        return { resonance: Resonance.SILENCE, message: "" };
    }

    const guesser = chamber.seers.find((seer) => seer.seerId === seerId);
    if (!guesser) {
        return { resonance: Resonance.SCRIPT, message: script };
    }

    const guess = script.trim().toLowerCase();
    const enigma = chamber.enigma.toLowerCase();

    if (guess === enigma) {
        chamber.unveiledSeers.push(seerId);
        return { resonance: Resonance.UNVEILED, message: `'${guesser.epithet}' unvailed the enigma!` };
    }

    const isClose = enigma.includes(guess) && Math.abs(enigma.length - guess.length) < 2;

    if (isClose) {
        return { resonance: Resonance.GLIMPSE, message: `'${guesser.epithet}' got a glimpse of the enigma!` };
    }

    return { resonance: Resonance.SCRIPT, message: script };
}

export default {
    decipherEnigma,
};
