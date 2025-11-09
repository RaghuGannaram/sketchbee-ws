import util from "util";
import envAccess from "@src/configs/env.config";
import { colorCode } from "@src/types/index";
import chalk from "chalk";
import winston from "winston";

const { addColors, createLogger, format, transports } = winston;

addColors(colorCode);

const level = envAccess.log.level();

const isServerless = process.env["VERCEL"] === "1" || process.env["AWS_LAMBDA_FUNCTION_NAME"] !== undefined;

const consoleLogFormat = format.printf(({ level, message, timestamp, stack }) => {
	const colorizedTimestamp = chalk.gray(timestamp);
	const formattedMessage = typeof message === "object" ? util.inspect(message) : message;
	const colorizedStack = stack ? chalk.red(stack) : "";

	let logMessage = `${colorizedTimestamp} ${level} ${formattedMessage}`;

	if (stack) {
		logMessage += `\n${colorizedStack}`;
	}

	return logMessage;
});

const fileLogFormat = format.printf(({ level, message, timestamp }) => {
	const msgStr = typeof message === "string" ? message : util.inspect(message);
	const unColoredMessage = msgStr.replace(/\x1B\[\d+m/g, "");
	const formattedMessage = typeof unColoredMessage === "object" ? util.inspect(unColoredMessage) : unColoredMessage;

	return `${timestamp} ${level}: ${formattedMessage}`;
});

const options: winston.LoggerOptions = {
	level: level,
	transports: [
		new transports.Console({
			format: format.combine(format.colorize(), format.splat(), format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }), format.errors({ stack: true }), consoleLogFormat),
		}),
		...(!isServerless
			? [
					new transports.File({
						filename: "logs/error.log",
						format: format.combine(format.splat(), format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }), format.errors({ stack: true }), fileLogFormat),
						level: "error",
					}),
					new transports.File({
						filename: "logs/out.log",
						format: format.combine(format.splat(), format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }), format.errors({ stack: true }), fileLogFormat),
					}),
				]
			: []),
	],
};

const logger = createLogger(options);

export default logger;
