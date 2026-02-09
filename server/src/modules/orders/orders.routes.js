import { Router } from "express";
import * as ordersController from "./orders.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

// History
router.get("/", ordersController.list);
router.get("/:id", ordersController.getById);

export default router;
