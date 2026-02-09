import { Router } from "express";
import * as currentOrderController from "./current-order.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = Router();

// All current-order endpoints require auth
router.use(authMiddleware);

// GET /orders/current
router.get("/", currentOrderController.get);

// POST /orders/current/items
router.post("/items", currentOrderController.addItem);

// PATCH /orders/current/items/:productId
router.patch("/items/:productId", currentOrderController.setItemQty);

// POST /orders/current/checkout
router.post("/checkout", currentOrderController.checkout);

export default router;
