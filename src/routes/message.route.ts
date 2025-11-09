import express, { type Router } from "express";
import messageController from "@src/controllers/message.controller";
import authenticate from "@src/middlewares/auth.middleware";

const router: Router = express.Router();

router.get("/:chatId", authenticate, messageController.fetchMessages);

router.post("/", authenticate, messageController.sendMessage);

export default router;
