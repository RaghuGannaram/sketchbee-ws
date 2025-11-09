export enum ErrorExposureDepth {
	HTTP = "HTTP",
	BUSINESS = "BUSINESS",
	DATA = "DATA",
	COMPLETE = "COMPLETE",
}

export const errorExposureDepthCode: Record<ErrorExposureDepth, number> = {
	[ErrorExposureDepth.HTTP]: 1,
	[ErrorExposureDepth.BUSINESS]: 2,
	[ErrorExposureDepth.DATA]: 3,
	[ErrorExposureDepth.COMPLETE]: Number.MAX_SAFE_INTEGER,
};

export interface ApplicationError extends Error {
	status: number;
	message: string;
	type: string;
	cause?: ApplicationError | Error | null;
	stack?: string;
}
