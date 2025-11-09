import ms from "ms";
import AWS from "@src/configs/aws.config";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getAWSParams } from "@src/utils/env-info";
import { generateRandomName } from "@src/utils";
import { catchAsyncDataError, processAWSError } from "@src/utils/application-errors";
import logger from "@src/configs/logger.config";

const { bucket } = getAWSParams();

const getFile = catchAsyncDataError(async (key: string): Promise<string> => {
    logger.debug(`aws.service: getting signed URL for file: %s from s3 bucket`, key);

    let fileURL = "";
    const params = {
        Bucket: bucket,
        Key: key,
    };

    try {
        fileURL = await getSignedUrl(AWS.s3ClientInstance, new AWS.GetObjectCommand(params), {
            expiresIn: ms(AWS.signedURLValidity) / 1000,
        });
    } catch (error) {
        processAWSError(error);
    }

    return fileURL;
});

const uploadFile = catchAsyncDataError(async (imageCategory: string, imageBuffer: Buffer): Promise<string> => {
    logger.debug(`aws.service: uploading %s file to s3 bucket`, imageCategory);

    const uniqueFileName = imageCategory + "_" + generateRandomName(16);
    const params = {
        Bucket: bucket,
        Key: uniqueFileName,
        Body: imageBuffer,
        ContentType: "image/webp",
    };

    try {
        await AWS.s3ClientInstance.send(new AWS.PutObjectCommand(params));
    } catch (error) {
        processAWSError(error);
    }

    return uniqueFileName;
});

const deleteFile = catchAsyncDataError(async (key: string): Promise<void> => {
    logger.debug(`aws.service: deleting file: %s from s3 bucket`, key);

    const params = {
        Bucket: bucket,
        Key: key,
    };

    try {
        await AWS.s3ClientInstance.send(new AWS.DeleteObjectCommand(params));
    } catch (error) {
        processAWSError(error);
    }
});

export default {
    getFile,
    uploadFile,
    deleteFile,
};
