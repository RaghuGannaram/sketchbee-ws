import gameService from "@src/services/game.service";
import { emitRitual } from "@src/sockets/emitters/ritual.emitter";
import { type IOracle } from "@src/types/ritual.types";
import { Rites, type IChamber } from "@src/types/chamber.types";

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

function transitionToConsecration(chamber: IChamber): IOracle {
    chamber.rite = Rites.CONSECRATION;

    const randomCaster = chamber.seers[Math.floor(Math.random() * chamber.seers.length)];

    if (!randomCaster) {
        return {
            ok: false,
            message: "Consecration failed: No Seers present to cast.",
            rite: chamber.rite,
            chamber: chamber,
        };
    }

    const prophecies = gameService.summonProphecies();

    chamber.casterId = randomCaster.seerId;
    chamber.prophecies = prophecies;
    chamber.omen = "";
    chamber.enigma = "";
    chamber.unveiledSeers = [];
    chamber.currentCycle = (chamber.currentCycle || 0) + 1;

    return {
        ok: true,
        message: "Consecration: The Caster has been chosen and prophecies revealed.",
        rite: Rites.CONSECRATION,
        chamber: chamber,
        timer: {
            duration: chamber.pact.consecrationDurationMS,
            callback: () => executeRite(chamber),
        },
    };
}

function transitionToDivination(chamber: IChamber): IOracle {
    chamber.rite = Rites.DIVINATION;

    const currentCasterId = chamber.casterId;
    const availableProphecies = chamber.prophecies;

    if (!currentCasterId || !availableProphecies || availableProphecies.length === 0) {
        return {
            ok: false,
            message: "Divination failed: invalid caster or no prophecies available.",
            rite: chamber.rite,
            chamber: chamber,
        };
    }

    return {
        ok: true,
        message: `Divination: The Ritual is Invoked. Seer ${currentCasterId} must seal a prophecy.`,
        rite: Rites.DIVINATION,
        chamber: chamber,
        timer: {
            duration: chamber.pact.divinationDurationMS,
            callback: () => executeRite(chamber),
        },
    };
}

function transitionToManifestation(chamber: IChamber): IOracle {
    chamber.rite = Rites.MANIFESTATION;

    const enigma = chamber.enigma || chamber.prophecies[0]!;
    const omen = enigma
        .split("")
        .map((char) => (char === " " ? " " : "_"))
        .join("");

    chamber.omen = omen;
    chamber.prophecies = [];

    return {
        ok: true,
        message: "Manifestation: The prophecy has been sealed and is beginning to manifest.",
        rite: Rites.MANIFESTATION,
        chamber: chamber,
        timer: {
            duration: chamber.pact.manifestationDurationMS,
            callback: () => executeRite(chamber),
        },
    };
}

function transitionToRevelation(chamber: IChamber): IOracle {
    chamber.rite = Rites.REVELATION;

    return {
        ok: true,
        rite: Rites.REVELATION,
        message: "Revelation: The enigma is unveiled to all Seers.",
        chamber: chamber,
        timer: {
            duration: chamber.pact.revealDurationMS,
            callback: () => executeRite(chamber),
        },
    };
}
function transitionToDissolution(chamber: IChamber): IOracle {
    extinguishRitualTimer(chamber.chamberId);

    chamber.rite = Rites.DISSOLUTION;

    return {
        ok: true,
        message: "Dissolution: The ritual has concluded and the chamber is dissolved.",
        rite: Rites.DISSOLUTION,
        chamber: chamber,
    };
}

function invokeRitualTransition(chamber: IChamber, transitionFunc: (chamber: IChamber) => IOracle) {
    const oracle = transitionFunc(chamber);

    if (!oracle.ok) return;

    emitRitual(oracle);

    if (oracle.timer) {
        const deadline = igniteRitualTimer(chamber.chamberId, oracle.timer.duration, oracle.timer.callback);

        oracle.timeLeftMs = deadline - Date.now();
    }
}

export function executeRite(chamber: IChamber) {
    switch (chamber.rite) {
        case Rites.CONGREGATION:
            invokeRitualTransition(chamber, transitionToConsecration);
            break;

        case Rites.CONSECRATION:
            invokeRitualTransition(chamber, transitionToDivination);
            break;

        case Rites.DIVINATION:
            invokeRitualTransition(chamber, transitionToManifestation);
            break;

        case Rites.MANIFESTATION:
            invokeRitualTransition(chamber, transitionToRevelation);
            break;

        case Rites.REVELATION:
            invokeRitualTransition(chamber, transitionToDissolution);
            break;

        case Rites.DISSOLUTION:
            invokeRitualTransition(chamber, transitionToConsecration);
            break;

        default:
            invokeRitualTransition(chamber, transitionToConsecration);
    }
}

export function sealProphecy(chamber: IChamber, seerId: string, prophecy: string): { ok: boolean; message: string } {
    if (chamber.casterId !== seerId) {
        return { ok: false, message: "only the Caster can seal the prophecy." };
    }

    if (!chamber.prophecies.includes(prophecy)) {
        return { ok: false, message: "invalid prophecy selected." };
    }

    chamber.enigma = prophecy;
    invokeRitualTransition(chamber, transitionToManifestation);

    return { ok: true, message: "prophecy sealed successfully." };
}

export default {
    executeRite,
    sealProphecy,
};
