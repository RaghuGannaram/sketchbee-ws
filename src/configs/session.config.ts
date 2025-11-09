import envAccess from "@src/configs/env.config";

import logger from "@src/configs/logger.config";
import { RedisCache } from "@src/configs/redis.config";
import { UpstashCache } from "@src/configs/upstash.config";
import { CacheProvider, type ISessionStore } from "@src/types";
import chalk from "chalk";

const cacheProvider = envAccess.cache.provider();
let sessionStore: ISessionStore;

if (cacheProvider === CacheProvider.REDIS) {
	sessionStore = RedisCache.getInstance();
} else if (cacheProvider === CacheProvider.UPSTASH) {
	sessionStore = UpstashCache.getInstance();
} else {
	logger.error(`Invalid cache provider ${chalk.red("%s")}`, cacheProvider);
	throw new Error("Invalid cache provider type.");
}

export default sessionStore;
