import socketService from "@src/services/socket.service";
import logger from "@src/configs/logger.config";
import { type IOracle } from "@src/types/ritual.types";
import { Rites } from "@src/types/chamber.types";

function emit(oracle: IOracle) {
    const chamber = oracle.chamber;
    if (!chamber) return;

    const chamberId = chamber.chamberId;
    const terminus = oracle.terminus || 0;

    switch (oracle.rite) {
        case Rites.CONSECRATION:
            socketService.emitToChamber(chamberId, "ritual:rite", {
                rite: oracle.rite,
                message: oracle.message,
                casterId: chamber.casterId,
                terminus: terminus,
            });

            const caster = chamber.seers.find((seer) => seer.seerId === chamber.casterId)!;

            socketService.emitToSocket(caster.socketId, "ritual:prophecies", {
                casterId: chamber.casterId,
                prophecies: chamber.prophecies,
            });

            break;

        case Rites.DIVINATION:
            socketService.emitToChamber(chamberId, "ritual:rite", {
                rite: oracle.rite,
                message: oracle.message,
                terminus: terminus,
            });

            break;

        case Rites.MANIFESTATION:
            socketService.emitToChamber(chamberId, "ritual:rite", {
                rite: oracle.rite,
                message: oracle.message,
                casterId: chamber.casterId,
                omen: chamber.omen,
                terminus: terminus,
            });
            break;

        case Rites.REVELATION:
            socketService.emitToChamber(chamberId, "ritual:rite", {
                rite: oracle.rite,
                message: oracle.message,
                enigma: chamber.enigma,
                unveiledSeers: chamber.unveiledSeers,
                terminus: terminus,
            });
            break;

        case Rites.DISSOLUTION:
            socketService.emitToChamber(chamberId, "ritual:rite", {
                rite: oracle.rite,
                message: oracle.message,
            });
            break;

        default:
            logger.warn(`Emitter received unknown rite: ${oracle.rite}`);
    }
}

export default {
    emit,
};
