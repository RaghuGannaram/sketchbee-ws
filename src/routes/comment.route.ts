import express, { type Router } from "express";
import commentController from "@src/controllers/comment.controller";
import authenticate from "@src/middlewares/auth.middleware";

const router: Router = express.Router();

router.get("/all", commentController.getAllComments);

router.get("/user/:userId", commentController.getUserComments);

router.get("/post/:postId", commentController.getPostComments);

router.post("/", authenticate, commentController.addComment);

router.put("/", authenticate, commentController.updateComment);

router.put("/like", authenticate, commentController.likeComment);

router.delete("/:commentId", authenticate, commentController.deleteComment);

export default router;
