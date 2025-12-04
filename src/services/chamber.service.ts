import { ChamberPhase, type IChamber, type ISeer } from "@src/types/chamber.types";

const PRIMORDIAL_PACT = {
    QUORUM: 2,
    PLENUM: 8,
    MAX_CYCLES: 5,
    PROPHECY_DURATION_MS: 15000,
    FLUX_DURATION_MS: 80000,
    REVEAL_DURATION_MS: 8000,
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

function allocateChamber(): string {
    for (const chamber of retrieveChambers()) {
        if (chamber.seers.length <= chamber.pact.plenum) {
            return chamber.chamberId;
        }
    }
    return provisionChamber();
}

function provisionChamber(): string {
    const chamberId = generateChamberId();

    const newChamber: IChamber = {
        chamberId,
        seers: [],
        phase: ChamberPhase.GATHERING,
        casterId: null,
        prophecies: [],
        omen: null,
        enigma: null,
        sigilHistory: [],
        pact: {
            quorum: PRIMORDIAL_PACT.QUORUM,
            plenum: PRIMORDIAL_PACT.PLENUM,
            maxCycles: PRIMORDIAL_PACT.MAX_CYCLES,
            prophecyDurationMS: PRIMORDIAL_PACT.PROPHECY_DURATION_MS,
            fluxDurationMS: PRIMORDIAL_PACT.FLUX_DURATION_MS,
            revealDurationMS: PRIMORDIAL_PACT.REVEAL_DURATION_MS,
        },
        manifestedAt: Date.now(),
    };

    persistChamber(newChamber);
    return chamberId;
}

function registerSeer(
    chamberId: string,
    profile: { seerId: string; socketId: string; epithet: string; guise: string }
): { ok: boolean; message: string; seer: ISeer | null } {
    const chamber = retrieveChamber(chamberId);

    if (!chamber) {
        return { ok: false, message: "chamber not found", seer: null };
    }

    const existingIndex = chamber.seers.findIndex((seer) => seer.seerId === profile.seerId);

    if (existingIndex !== -1 && chamber.seers[existingIndex]) {
        const existingSeer = chamber.seers[existingIndex];

        existingSeer.socketId = profile.socketId;
        existingSeer.epithet = profile.epithet;
        existingSeer.guise = profile.guise;

        chamber.seers[existingIndex] = existingSeer;

        return { ok: true, message: "seer re-connected", seer: existingSeer };
    }

    if (chamber.seers.length >= chamber.pact.plenum) {
        return { ok: false, message: "chamber is full", seer: null };
    }

    const seer: ISeer = {
        seerId: profile.seerId,
        socketId: profile.socketId,
        chamberId: chamberId,
        epithet: profile.epithet,
        guise: profile.guise,
        essence: 0,
        isCaster: false,
        hasUnveiled: false,
        currentEssence: 0,
    };

    const hasExistingCaster = chamber.seers.some((s) => s.isCaster);
    const hasReachedQuorum = chamber.seers.length + 1 >= chamber.pact.quorum;

    if (!hasExistingCaster && hasReachedQuorum) {
        chamber.casterId = seer.seerId;
        seer.isCaster = true;
    }

    chamber.seers.push(seer);

    return { ok: true, message: "seer registered", seer };
}

function deregisterSeer(
    chamberId: string,
    seerId: string
): { deregistered: boolean; chamberDisposed: boolean; seer: ISeer | null } {
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

export default {
    allocateChamber,
    retrieveChamber,
    retrieveChambers,
    generateSeerId,
    registerSeer,
    deregisterSeer,
    retrieveSeers,
};
