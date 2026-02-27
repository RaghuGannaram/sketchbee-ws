import gameService from "@src/services/game.service";
import ritualEmitter from "@src/sockets/emitters/ritual.emitter";
import logger from "@src/configs/logger.config";
import { Rites, type IChamber } from "@src/types/chamber.types";
import { type IOracle } from "@src/types/ritual.types";

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
		.map((char) => (char === " " ? " " : "_ "))
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

	if (oracle.timer) {
		const deadline = igniteRitualTimer(chamber.chamberId, oracle.timer.duration, oracle.timer.callback);
		oracle.terminus = deadline;
	}

	ritualEmitter.emit(oracle);
}

export function executeRite(chamber: IChamber) {
	switch (chamber.rite) {
		case Rites.CONGREGATION:
			logger.debug("ritual.service: Transitioning to CONSECRATION in chamber %s", chamber.chamberId);
			invokeRitualTransition(chamber, transitionToConsecration);
			break;

		case Rites.CONSECRATION:
			logger.debug("ritual.service: Transitioning to DIVINATION in chamber %s", chamber.chamberId);
			invokeRitualTransition(chamber, transitionToDivination);
			break;

		case Rites.DIVINATION:
			logger.debug("ritual.service: Transitioning to MANIFESTATION in chamber %s", chamber.chamberId);
			invokeRitualTransition(chamber, transitionToManifestation);
			break;

		case Rites.MANIFESTATION:
			logger.debug("ritual.service: Transitioning to REVELATION in chamber %s", chamber.chamberId);
			invokeRitualTransition(chamber, transitionToRevelation);
			break;

		case Rites.REVELATION:
			if (chamber.currentCycle >= chamber.pact.maxCycles) {
				logger.debug("ritual.service: Transitioning to DISSOLUTION in chamber %s as maximum cycles reached", chamber.chamberId);
				invokeRitualTransition(chamber, transitionToDissolution);
			} else {
				logger.debug("ritual.service: Transitioning to CONSECRATION in chamber %s", chamber.chamberId);
				invokeRitualTransition(chamber, transitionToConsecration);
			}
			break;

		case Rites.DISSOLUTION:
			logger.debug("ritual.service: chamber %s already dissolved", chamber.chamberId);
			break;

		default:
			logger.warn("ritual.service: Unknown rite %s in chamber %s. Resetting to CONSECRATION.", chamber.rite, chamber.chamberId);
			chamber.rite = Rites.CONGREGATION;
			invokeRitualTransition(chamber, transitionToConsecration);
			break;
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

export function calculateEssence(startedAt: number, durationMs: number): number {
	const now = Date.now();
	const elapsedMS = now - startedAt;
	const remainingMS = durationMs - elapsedMS;

	if (remainingMS <= 0) return 0;

	const baseScore = 100;
	const bonusMax = 400;
	const ratio = remainingMS / durationMs;

	return Math.floor(baseScore + ratio * bonusMax);
}

export function rewardSeer(chamber: IChamber, seerId: string) {
	const startedAt = chamber.riteStartedAt;
	const riteDurationMS = chamber.pact.manifestationDurationMS;

	const currentEssence = calculateEssence(startedAt, riteDurationMS);

	const seer = chamber.seers.find((s) => s.seerId === seerId);

	if (seer) {
		seer.currentEssence = currentEssence;
		seer.essence += currentEssence;

		if (!chamber.unveiledSeers.some((s) => s.seerId === seerId)) {
			chamber.unveiledSeers.push(seer);
		}
	}
}

export default {
	executeRite,
	sealProphecy,
	rewardSeer,
};
