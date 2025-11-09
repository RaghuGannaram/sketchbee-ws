import logger from "@src/configs/logger.config";
import morgan from "morgan";

const stream = {
	write: (message: { toString: () => string }) => logger.http(message.toString().trim()),
};

const skip = () => {
	return false;
};

const morganMiddleware = morgan(" :remote-addr :method :url :status :res[content-length] - :response-time ms", {
	stream,
	skip,
});

export default morganMiddleware;
