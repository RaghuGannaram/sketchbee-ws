import { Socket } from "socket.io";
import logger from "@src/configs/logger.config";
import socketService from "@src/services/socket.service";
import chamberService from "@src/services/chamber.service";
import runeService, { Resonance } from "@src/services/rune.service";
import { type ISigil } from "@src/types/rune.types";
import ritualService from "@src/services/ritual.service";

const socketAsync = (handler: Function) => {
	return async (...args: any[]) => {
		try {
			await handler(...args);
		} catch (err) {
			logger.error("rune.handler: Socket Error:", err);

			const lastArg = args[args.length - 1];
			if (typeof lastArg === "function") {
				lastArg({ ok: false, error: "Internal Server Error" });
			}
		}
	};
};

export default function registerRuneHandler(socket: Socket) {
	socket.on(
		"rune:sigil",
		socketAsync((data: { chamberId: string; casterId: string; sigils: ISigil[] }, cb: Function) => {
			const { chamberId, casterId, sigils } = data;

			if (!chamberId || !casterId || !sigils) {
				return cb && cb({ ok: false, message: "invalid parameters" });
			}

			const chamber = chamberService.retrieveChamber(chamberId);
			if (!chamber) {
				return cb && cb({ ok: false, message: "chamber not found" });
			}

			if (chamber.casterId !== casterId) {
				return (
					cb &&
					cb({
						ok: false,
						message: "only the caster can draw sigils",
					})
				);
			}

			if (!Array.isArray(sigils) || sigils.length === 0) {
				return cb && cb({ ok: false, message: "invalid sigils data" });
			}

			socketService.broadcastToChamberExcept(chamberId, casterId, "rune:sigil", {
				chamberId,
				casterId,
				sigils,
			});

			return cb && cb({ ok: true, message: "sigils broadcasted" });
		})
	);

	socket.on(
		"rune:shift",
		socketAsync((data: { chamberId: string; casterId: string; vision: string }, cb: Function) => {
			const { chamberId, casterId, vision } = data;

			if (!chamberId || !casterId || !vision) {
				return cb && cb({ ok: false, message: "invalid parameters" });
			}

			const chamber = chamberService.retrieveChamber(chamberId);
			if (!chamber) {
				return cb && cb({ ok: false, message: "chamber not found" });
			}

			if (casterId !== chamber.casterId) {
				return (
					cb &&
					cb({
						ok: false,
						message: "only the caster can shift the vellum",
					})
				);
			}

			socketService.broadcastToChamberExcept(chamberId, casterId, "rune:shift", {
				chamberId,
				casterId,
				vision,
			});

			return cb && cb({ ok: true, message: "vision broadcasted" });
		})
	);

	socket.on(
		"rune:void",
		socketAsync((data: { chamberId: string; casterId: string }, cb: Function) => {
			const { chamberId, casterId } = data;

			if (!chamberId || !casterId) {
				return cb && cb({ ok: false, message: "invalid parameters" });
			}

			const chamber = chamberService.retrieveChamber(chamberId);
			if (!chamber) {
				return cb && cb({ ok: false, message: "chamber not found" });
			}

			if (casterId !== chamber.casterId) {
				return (
					cb &&
					cb({
						ok: false,
						message: "only the caster can clear the vellum",
					})
				);
			}

			socketService.broadcastToChamberExcept(chamberId, casterId, "rune:void", {
				chamberId,
				casterId,
			});
			return cb && cb({ ok: true, message: "vellum cleared" });
		})
	);

	socket.on(
		"rune:script",
		socketAsync(
			(
				data: {
					chamberId: string;
					seerId: string;
					epithet: string;
					script: string;
				},
				cb: Function
			) => {
				const { chamberId, seerId, epithet, script } = data;

				if (!chamberId || !seerId || !epithet || !script) {
					return cb && cb({ ok: false, message: "invalid parameters" });
				}

				const chamber = chamberService.retrieveChamber(chamberId);
				if (!chamber) {
					return cb && cb({ ok: false, message: "chamber not found" });
				}

				const interpretation = runeService.decipherEnigma(chamber, seerId, script);

				switch (interpretation.resonance) {
					case Resonance.UNVEILED:
						ritualService.rewardSeer(chamber, seerId);

						socketService.emitToChamber(chamberId, "rune:unveiled", {
							epithet,
							seerId,
							script: interpretation.message,
							timestamp: Date.now(),
						});

						if (chamber.unveiledSeers.length === chamber.seers.length - 1) {
							ritualService.executeRite(chamber);
						}
						break;

					case Resonance.SCRIPT:
						socketService.emitToChamber(chamberId, "rune:script", {
							epithet,
							script: interpretation.message,
							timestamp: Date.now(),
						});
						break;

					case Resonance.SILENCE:
						break;
				}

				return cb && cb({ ok: true, message: "interpretation processed" });
			}
		)
	);
}
