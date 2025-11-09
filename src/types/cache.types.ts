export enum CacheProvider {
	REDIS = "redis",
	UPSTASH = "upstash",
}

export interface IRedisCredentials {
	host: string;
	port: number;
	username: string;
	password: string;
}

export interface IUpstashCredentials {
	rest_url: string;
	token: string;
}

export type ICacheCredentials = IRedisCredentials | IUpstashCredentials;

export interface ISessionStore {
	set(key: string, value: string, ttl?: number): Promise<void>;
	get(key: string): Promise<string | null>;
	delete(key: string): Promise<void>;
}
