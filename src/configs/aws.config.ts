import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import  envAccess from "@src/configs/env.config";
import logger from "@src/configs/logger.config";

const { accessKey, secretAccessKey, region, signedUrlValidity } = envAccess.aws.credentials();

const s3ClientInstance = new S3Client({
    region: region,
    credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretAccessKey,
    },
});

logger.info(`aws s3 client: instance created successfully... ☁️`);

export default {
    s3ClientInstance,
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand,
    signedUrlValidity,
};
