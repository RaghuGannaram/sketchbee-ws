import express, { type Router } from "express";
import chatController from "@src/controllers/chat.controller";
import authenticate from "@src/middlewares/auth.middleware";

const router: Router = express.Router();

router.get("/all", authenticate, chatController.getAllChats);

router.get("/private", authenticate, chatController.getPrivateChats);

router.get("/group", authenticate, chatController.getGroupChats);

router.get("/members/:chatId", authenticate, chatController.getChatMembers);

router.post("/", authenticate, chatController.createChat);

router.post("/group", authenticate, chatController.createGroupChat);

router.post("/group/join", authenticate, chatController.joinGroup);

router.post("/group/leave", authenticate, chatController.leaveGroup);

router.delete("/:chatId", authenticate, chatController.deleteChat);

router.delete("/group/:chatId", authenticate, chatController.deleteGroupChat);

export default router;
