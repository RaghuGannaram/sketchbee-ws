import envAccess from "@src/configs/env.config";
import logger from "@src/configs/logger.config";
import chalk from "chalk";
import mongoose, { type Connection } from "mongoose";
import { type ConnectOptions } from "mongoose";

type Config = Record<ReturnType<typeof envAccess.database.mongoUrl>, ConnectOptions>;

const mongoURL = envAccess.database.mongoUrl();
const currentEnv = envAccess.app.env();

const dbConfig: Config = {
	development: {
		dbName: "developmentDB",
		bufferCommands: true,
		family: 4,
		maxPoolSize: 100,
		socketTimeoutMS: 30000,
		connectTimeoutMS: 30000,
		serverSelectionTimeoutMS: 5000,
	},
	production: {
		dbName: "productionDB",
		autoIndex: false,
		autoCreate: false,
		bufferCommands: false,
		family: 4,
		maxPoolSize: 100,
		socketTimeoutMS: 30000,
		connectTimeoutMS: 30000,
		serverSelectionTimeoutMS: 30000,
	},
};

const mongoOptions = dbConfig[currentEnv];

mongoose.set("debug", currentEnv === "development");
mongoose.connect(mongoURL, mongoOptions);

const db: Connection = mongoose.connection;

db.on("connecting", () => {
	logger.info("mongodb server: connecting...");
});

db.on("connected", () => {
	const { name, host, port, models } = db;

	logger.info("mongodb server: successful...🍃");
	logger.debug(`mongodb server: host: ${chalk.magenta("%s")}:${chalk.magenta("%s")}`, host, port);
	logger.debug(`mongodb server: name: ${chalk.magenta("%s")}, models: ${chalk.grey("%o")}`, name, models);
});

db.on("open", () => {
	logger.info("mongodb server: open...");
});

db.on("disconnecting", () => {
	logger.info("mongodb server: disconnecting...");
});

db.on("disconnected", () => {
	logger.error("mongodb server: disconnected...");
});

db.on("close", () => {
	logger.error("mongodb server: closed...");
});

db.on("reconnected", () => {
	logger.info("mongodb server: reconnected...");
});

db.on("error", () => {
	logger.error("mongodb server: Unable to connect to Database...🙁");
	throw new Error("Unable to connect to MongoDB Database");
});

process.on("SIGINT", () => {
	logger.error("mongodb server: connection terminated...🟥");
	db.close();
});

export default db;
