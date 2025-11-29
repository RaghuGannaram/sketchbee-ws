import express, { type Router } from "express";
import chamberController from "@src/controllers/chamber.controller";

const router: Router = express.Router();

router.get("/all", chamberController.getAllChambers);

export default router;
