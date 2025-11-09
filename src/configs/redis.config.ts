import envAccess from "@src/configs/env.config";
import logger from "@src/configs/logger.config";
import { CacheProvider, type ISessionStore, type IRedisCredentials } from "@src/types";
import chalk from "chalk";
import { createClient, type RedisClientType } from "redis";

export class RedisCache implements ISessionStore {
	private static instance: RedisCache;
	private client: RedisClientType;
	private host: string;

	private constructor(host: string, port: number, username: string, password: string) {
		this.client = createClient({
			socket: { host, port },
			username,
			password,
		});

		this.host = host;
		this.setupEventListeners();
		this.client.connect().catch(console.error);
	}

	public static getInstance(): RedisCache {
		if (!RedisCache.instance) {
			const { host, port, username, password } = envAccess.cache.credentials(CacheProvider.REDIS) as IRedisCredentials;
			RedisCache.instance = new RedisCache(host, port, username, password);
		}
		return RedisCache.instance;
	}

	async set(key: string, value: string, ttl?: number): Promise<void> {
		if (ttl) {
			await this.client.SET(key, value, { EX: ttl });
		} else {
			await this.client.SET(key, value);
		}
	}

	async get(key: string): Promise<string | null> {
		return await this.client.GET(key);
	}

	async delete(key: string): Promise<void> {
		await this.client.DEL(key);
	}

	private setupEventListeners(): void {
		this.client.on("connect", () => {
			logger.info("cache server: connecting...");
			logger.debug(`cache server: connected to client : ${chalk.magenta("%s")}`, this.host);
		});

		this.client.on("ready", () => {
			logger.info("cache server: connected...🚗");
		});

		this.client.on("error", (err) => {
			logger.error("cache server: error %o", err);
		});

		this.client.on("reconnecting", () => {
			logger.warn("cache server: reconnecting...");
		});

		this.client.on("end", () => {
			logger.warn("cache server: ended...");
		});

		process.on("SIGINT", async () => {
			logger.error("cache server: connection terminated...🟥");
			await this.client.quit();
			process.exit(0);
		});
	}
}
