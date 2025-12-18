import { Router } from "express";
import { create } from "./orders.controller.js";

const router = Router();

router.post("/", create);

export default router;
