import envAccess from "@src/configs/env.config";
import logger from "@src/configs/logger.config";
import { CacheProvider, type ISessionStore, type IUpstashCredentials } from "@src/types";
import { Redis } from "@upstash/redis";
import chalk from "chalk";

export class UpstashCache implements ISessionStore {
	private static instance: UpstashCache;
	private redis: Redis;
	private instanceName: string;

	private constructor(rest_url: string, token: string) {
		this.redis = new Redis({ url: rest_url, token: token });
		this.instanceName = new URL(rest_url).hostname;

		this.initHealthCheck();
	}

	public static getInstance(): UpstashCache {
		if (!UpstashCache.instance) {
			const { rest_url, token } = envAccess.cache.credentials(CacheProvider.UPSTASH) as IUpstashCredentials;
			UpstashCache.instance = new UpstashCache(rest_url, token);
		}
		return UpstashCache.instance;
	}

	async set(key: string, value: string, ttl?: number): Promise<void> {
		await this.redis.set(key, value);
		if (ttl) {
			await this.redis.expire(key, ttl);
		}
	}

	async get(key: string): Promise<string | null> {
		return await this.redis.get(key);
	}

	async delete(key: string): Promise<void> {
		await this.redis.del(key);
	}

	private async initHealthCheck(): Promise<void> {
		try {
			await this.redis.set("health_check", "connected");
			logger.info("cache server: connected...🚗");
			logger.debug(`cache server: connected to client : ${chalk.magenta("%s")}`, this.instanceName);
		} catch (error) {
			logger.error("cache server: connection failed ❌", error);
		}

		setInterval(async () => {
			try {
				const healthCheck = await this.redis.get("health_check");
				if (!healthCheck) {
					throw new Error("No response from Redis");
				}
				logger.debug("cache server: connection healthy ✅");
			} catch (error) {
				logger.warn("cache server: connection issue detected...🔄");
			}
		}, 600000);

		process.on("SIGINT", async () => {
			logger.error("cache server: connection terminated...🟥");
			process.exit(0);
		});
	}
}
