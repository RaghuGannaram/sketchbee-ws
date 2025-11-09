// src/config/env.ts
import { LogLevel, ErrorExposureDepth, CacheProvider, type ICacheCredentials } from "@src/types";

const envAccess = {
	app: {
		env(): "development" | "production" {
			return process.env["NODE_ENV"] === "production" ? "production" : "development";
		},

		port(): number {
			return Number(process.env["PORT"]) || 5000;
		},
	},
	api: {
		gatewayUrl(): string {
			return process.env["NODE_ENV"] === "production" ? process.env["API_GATEWAY_PROD_URL"] : process.env["API_GATEWAY_DEV_URL"];
		},
	},
	database: {
		mongoUrl(): string {
			return process.env["MONGODB_URL"];
		},

		postgresUrl(): string {
			return process.env["POSTGRES_URL"];
		},
	},
	cache: {
		provider(): CacheProvider {
			return process.env["CACHE_PROVIDER"] as CacheProvider;
		},

		credentials(type: CacheProvider): ICacheCredentials {
			switch (type) {
				case CacheProvider.REDIS:
					return {
						host: process.env["REDIS_HOST"],
						port: Number(process.env["REDIS_PORT"]),
						username: process.env["REDIS_USERNAME"],
						password: process.env["REDIS_PASSWORD"],
					};
				case CacheProvider.UPSTASH:
					return {
						rest_url: process.env["UPSTASH_REDIS_REST_URL"],
						token: process.env["UPSTASH_REDIS_REST_TOKEN"],
					};
				default:
					throw new Error("Invalid cache type");
			}
		},
	},
	jwt: {
		credentials(): {
			accessTokenSecret: string;
			refreshTokenSecret: string;
			accessTokenValidity: string;
			refreshTokenValidity: string;
			refreshTokenMaxAge: string;
		} {
			return {
				accessTokenSecret: process.env["ACCESS_TOKEN_SECRET"],
				refreshTokenSecret: process.env["REFRESH_TOKEN_SECRET"],
				accessTokenValidity: process.env["ACCESS_TOKEN_VALIDITY"],
				refreshTokenValidity: process.env["REFRESH_TOKEN_VALIDITY"],
				refreshTokenMaxAge: process.env["REFRESH_TOKEN_MAX_AGE"],
			};
		},
	},
	aws: {
		credentials(): {
			accessKey: string;
			secretAccessKey: string;
			region: string;
			bucket: string;
			signedUrlValidity: string;
			cloudFrontUrl: string;
		} {
			return {
				accessKey: process.env["AWS_ACCESS_KEY_ID"],
				secretAccessKey: process.env["AWS_SECRET_ACCESS_KEY"],
				region: process.env["AWS_BUCKET_REGION"],
				bucket: process.env["AWS_BUCKET_NAME"],
				signedUrlValidity: process.env["AWS_SIGNED_URL_EXPIRATION"],
				cloudFrontUrl: process.env["AWS_CLOUD_FRONT_URL"],
			};
		},
	},
	acr: {
		credentials(): {
			host: string;
			accessKey: string;
			accessSecret: string;
		} {
			return {
				host: process.env["ACR_HOST"],
				accessKey: process.env["ACR_ACCESS_KEY"],
				accessSecret: process.env["ACR_ACCESS_SECRET"],
			};
		},
	},
	log: {
		level(): LogLevel {
			if (process.env["NODE_ENV"] === "development") {
				return LogLevel.SILLY;
			}

			return (process.env["LOG_LEVEL"] as LogLevel) || LogLevel.INFO;
		},
	},
	error: {
		exposureDepth(): ErrorExposureDepth {
			if (process.env["NODE_ENV"] === "development") {
				return ErrorExposureDepth.COMPLETE;
			}

			return (process.env["ERROR_EXPOSURE_DEPTH"] as ErrorExposureDepth) || ErrorExposureDepth.BUSINESS;
		},
	},
};

export default envAccess;
