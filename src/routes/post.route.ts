import express, { type Router } from "express";
import postController from "@src/controllers/post.controller";
import authenticate from "@src/middlewares/auth.middleware";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router: Router = express.Router();

router.get("/all", postController.getAllPosts);

router.get("/user/:userId", postController.getUserPosts);

router.get("/timeline", authenticate, postController.getTimelinePosts);

router.get("/:postId", postController.getPost);

router.post("/", authenticate, upload.single("image"), postController.addPost);

router.put("/", authenticate, upload.single("image"), postController.updatePost);

router.put("/like", authenticate, postController.likePost);

router.delete("/:postId", authenticate, postController.deletePost);

export default router;
