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

function allocateChamber(): string {
    for (const chamber of retrieveChambers()) {
        if (chamber.seers.length <= chamber.pact.plenum) {
            return chamber.chamberId;
        }
    }
    return provisionChamber();
}

function provisionChamber(): string {
    const chamberId = `chamber_${Date.now().toString(36)}_${Math.floor(Math.random() * 1000)}`;

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
    profile: { seerId: string; socketId: string; epithet: string; guise?: string }
): { ok: boolean; message?: string; seer: ISeer | null } {
    const chamber = retrieveChamber(chamberId);

    if (!chamber) {
        return { ok: false, seer: null, message: "chamber not found" };
    }

    const existingIndex = chamber.seers.findIndex((p) => p.socketId === profile.socketId);

    if (existingIndex === -1 && chamber.seers.length >= chamber.pact.plenum) {
        return { ok: false, seer: null, message: "chamber is full" };
    }

    const existingData = existingIndex !== -1 ? chamber.seers[existingIndex] : null;

    const seer: ISeer = {
        seerId: profile.seerId,
        socketId: profile.socketId,
        epithet: profile.epithet,
        guise: profile.guise || "",
        essence: existingData ? existingData.essence : 0,
        isCaster: false,
        hasUnveiled: false,
        currentEssence: 0,
    };

    if (existingIndex !== -1) {
        chamber.seers[existingIndex] = seer;

        return { ok: true, seer, message: "seer re-registered" };
    } else {
        chamber.seers.push(seer);

        return { ok: true, seer, message: "seer registered" };
    }
}

function deregisterSeer(
    chamberId: string,
    socketId: string
): { deregistered: boolean; chamberDisposed: boolean; seer: ISeer | null } {
    const chamber = retrieveChamber(chamberId);

    if (!chamber) {
        return { deregistered: false, chamberDisposed: false, seer: null };
    }

    const seer = chamber.seers.find((p) => p.socketId === socketId);

    if (!seer) {
        return { deregistered: false, chamberDisposed: false, seer: null };
    }

    chamber.seers = chamber.seers.filter((p) => p.socketId !== socketId);
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
    registerSeer,
    deregisterSeer,
    retrieveSeers,
};
