import express, { type Router } from "express";
import userController from "@src/controllers/user.controller";
import authenticate from "@src/middlewares/auth.middleware";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router: Router = express.Router();

router.get("/all", userController.getAllUsers);

router.get("/:userId", userController.getUserByID);

router.put("/", authenticate, userController.updateUserInfo);

router.put("/image/", authenticate, upload.single("image"), userController.updateUserImage);

router.put("/follow/", authenticate, userController.followUser);

router.delete("/", authenticate, userController.deleteUser);

export default router;
