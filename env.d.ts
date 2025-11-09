declare module NodeJS {
    interface ProcessEnv {
        MONGODB_URL: string;
        POSTGRES_URL: string;
        REDIS_HOST: string;
        REDIS_PORT: string;
        REDIS_USERNAME: string;
        REDIS_PASSWORD: string;
        UPSTASH_REDIS_REST_URL: string;
        UPSTASH_REDIS_REST_TOKEN: string;
        CACHE_PROVIDER: string;
        AWS_ACCESS_KEY_ID: string;
        AWS_SECRET_ACCESS_KEY: string;
        AWS_BUCKET_NAME: string;
        AWS_BUCKET_REGION: string;
        AWS_SIGNED_URL_EXPIRATION: string;
        AWS_CLOUD_FRONT_URL: string;
        ACCESS_TOKEN_SECRET: string;
        REFRESH_TOKEN_SECRET: string;
        ACCESS_TOKEN_VALIDITY: string;
        REFRESH_TOKEN_VALIDITY: string;
        REFRESH_TOKEN_MAX_AGE: string;
        ACR_HOST: string;
        ACR_ACCESS_KEY: string;
        ACR_ACCESS_SECRET: string;
        API_GATEWAY_DEV_URL: string;
        API_GATEWAY_PROD_URL: string;
        NODE_ENV: "development" | "production";
        PORT: string;
        LOG_LEVEL: string;
        ERROR_EXPOSURE_DEPTH: string;
    }
}
