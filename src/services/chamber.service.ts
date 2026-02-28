import { Rites, type IChamber, type ISeer } from "@src/types/chamber.types";

const PRIMORDIAL_PACT = {
	QUORUM: 2,
	PLENUM: 8,
	MAX_CYCLES: 10,
	CONSECRATION_DURATION_MS: 3_000,
	DIVINATION_DURATION_MS: 15_000,
	MANIFESTATION_DURATION_MS: 90_000,
	REVEAL_DURATION_MS: 15_000,
};

const chambers = new Map<string, IChamber>();

function persistChamber(chamber: IChamber): void {
	chambers.set(chamber.chamberId, chamber);
}

function retrieveChamber(chamberId: string): IChamber | null {
	return chambers.get(chamberId) || null;
}

function retrieveChambers(): IChamber[] {
	return Array.from(chambers.values());
}

function disposeChamber(chamberId: string): void {
	chambers.delete(chamberId);
}

function generateChamberId(topic: string = "chamber"): string {
	const cleanName =
		topic
			.replace(/[^a-zA-Z0-9]/g, "")
			.toLowerCase()
			.slice(0, 10) || "chamber";

	const timestamp = Date.now().toString(36);

	const random = Math.random().toString(36).substring(2, 7);

	return `${cleanName}_${timestamp}_${random}`;
}

function generateSeerId(epithet: string): string {
	const cleanName =
		epithet
			.replace(/[^a-zA-Z0-9]/g, "")
			.toLowerCase()
			.slice(0, 10) || "seer";

	const timestamp = Date.now().toString(36);

	const random = Math.random().toString(36).substring(2, 7);
	return `${cleanName}_${timestamp}_${random}`;
}

function provisionChamber(): string {
	const chamberId = generateChamberId();

	const newChamber: IChamber = {
		chamberId,
		seers: [],
		rite: Rites.CONGREGATION,
		riteStartedAt: Date.now(),
		casterId: null,
		prophecies: [],
		omen: "",
		enigma: "",
		sigilHistory: [],
		unveiledSeers: [],
		currentCycle: 0,
		pact: {
			quorum: PRIMORDIAL_PACT.QUORUM,
			plenum: PRIMORDIAL_PACT.PLENUM,
			maxCycles: PRIMORDIAL_PACT.MAX_CYCLES,
			consecrationDurationMS: PRIMORDIAL_PACT.CONSECRATION_DURATION_MS,
			divinationDurationMS: PRIMORDIAL_PACT.DIVINATION_DURATION_MS,
			manifestationDurationMS: PRIMORDIAL_PACT.MANIFESTATION_DURATION_MS,
			revealDurationMS: PRIMORDIAL_PACT.REVEAL_DURATION_MS,
		},
		establishedAt: Date.now(),
	};

	persistChamber(newChamber);
	return chamberId;
}

function allocateChamber(): string {
	for (const chamber of retrieveChambers()) {
		if (chamber.seers.length < chamber.pact.plenum) {
			return chamber.chamberId;
		}
	}
	return provisionChamber();
}

function registerSeer(
	chamberId: string,
	profile: {
		seerId: string;
		socketId: string;
		epithet: string;
		guise: string;
	}
): {
	ok: boolean;
	message: string;
	seer: ISeer | null;
	hasReachedQuorum: boolean;
	hasSurpassedQuorum: boolean;
} {
	const chamber = retrieveChamber(chamberId);

	if (!chamber) {
		return {
			ok: false,
			message: "chamber not found",
			seer: null,
			hasReachedQuorum: false,
			hasSurpassedQuorum: false,
		};
	}

	if (chamber.seers.length >= chamber.pact.plenum) {
		return {
			ok: false,
			message: "chamber is full",
			seer: null,
			hasReachedQuorum: true,
			hasSurpassedQuorum: false,
		};
	}

	const existingIndex = chamber.seers.findIndex((seer) => seer.seerId === profile.seerId);

	if (existingIndex !== -1 && chamber.seers[existingIndex]) {
		const existingSeer = chamber.seers[existingIndex];

		existingSeer.socketId = profile.socketId;
		existingSeer.epithet = profile.epithet;
		existingSeer.guise = profile.guise;

		chamber.seers[existingIndex] = existingSeer;

		return {
			ok: true,
			message: "seer re-connected",
			seer: existingSeer,
			hasReachedQuorum: false,
			hasSurpassedQuorum: false,
		};
	}

	const seer: ISeer = {
		seerId: profile.seerId,
		socketId: profile.socketId,
		chamberId: chamberId,
		epithet: profile.epithet,
		guise: profile.guise,
		essence: 0,
		currentEssence: 0,
	};

	chamber.seers.push(seer);

	const hasReachedQuorum = chamber.seers.length === chamber.pact.quorum;
	const hasSurpassedQuorum = chamber.seers.length > chamber.pact.quorum;

	return { ok: true, message: "seer registered", seer, hasReachedQuorum, hasSurpassedQuorum };
}

function deregisterSeer(chamberId: string, seerId: string): { deregistered: boolean; chamberDisposed: boolean; seer: ISeer | null } {
	const chamber = retrieveChamber(chamberId);

	if (!chamber) {
		return { deregistered: false, chamberDisposed: false, seer: null };
	}

	const seer = chamber.seers.find((seer) => seer.seerId === seerId);

	if (!seer) {
		return { deregistered: false, chamberDisposed: false, seer: null };
	}

	chamber.seers = chamber.seers.filter((seer) => seer.seerId !== seerId);

	if (chamber.seers.length === 0) {
		disposeChamber(chamberId);

		return { deregistered: true, chamberDisposed: true, seer };
	}

	return { deregistered: true, chamberDisposed: false, seer };
}

function retrieveSeers(chamberId: string): ISeer[] {
	const chamber = retrieveChamber(chamberId);

	if (!chamber) return [];

	return Array.from(chamber.seers.values());
}

function fathomChamber(chamberId: string):
	| (Pick<IChamber, "rite" | "riteStartedAt" | "casterId" | "omen" | "currentCycle"> & {
			unveiledSeers: string[];
			totalCycles: number;
			terminus: number;
	  })
	| null {
	const chamber = retrieveChamber(chamberId);

	if (!chamber) return null;

	let activeDurationMS = 0;

	switch (chamber.rite) {
		case Rites.CONSECRATION:
			activeDurationMS = chamber.pact.consecrationDurationMS;
			break;
		case Rites.DIVINATION:
			activeDurationMS = chamber.pact.divinationDurationMS;
			break;
		case Rites.MANIFESTATION:
			activeDurationMS = chamber.pact.manifestationDurationMS;
			break;
		case Rites.REVELATION:
			activeDurationMS = chamber.pact.revealDurationMS;
			break;
		default:
			activeDurationMS = 0;
			break;
	}

	const terminus = chamber.riteStartedAt + activeDurationMS;

	return {
		rite: chamber.rite,
		riteStartedAt: chamber.riteStartedAt,
		casterId: chamber.casterId,
		omen: chamber.omen,
		unveiledSeers: chamber.unveiledSeers.map((seer) => seer.seerId),
		currentCycle: chamber.currentCycle,
		totalCycles: chamber.pact.maxCycles,
		terminus: terminus,
	};
}

export default {
	allocateChamber,
	retrieveChamber,
	retrieveChambers,
	disposeChamber,
	generateSeerId,
	registerSeer,
	deregisterSeer,
	retrieveSeers,
	fathomChamber,
};
