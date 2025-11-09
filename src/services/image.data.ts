import sharp from "sharp";
import { catchAsyncDataError, processImageError } from "@src/utils/application-errors";
import logger from "@src/configs/logger.config";

const processImage = catchAsyncDataError(async (imageBuffer: Buffer, options: { size: number }) => {
    const { size } = options;

    try {
        const { data, info } = await sharp(imageBuffer).webp().resize(size).toBuffer({
            resolveWithObject: true,
        });

        logger.debug(`image.service: image compressed successfully %o`, info);

        return data;
    } catch (error) {
        processImageError(error);
    }
});

export default {
    processImage,
};
