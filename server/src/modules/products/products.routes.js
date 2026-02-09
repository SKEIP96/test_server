import { Router } from "express";
import * as productsController from "./products.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = Router();

// public
router.get("/", productsController.list);
router.get("/:id", productsController.getById);

// protected (for now: any logged-in user can manage products)
router.post("/", authMiddleware, productsController.create);
router.patch("/:id", authMiddleware, productsController.update);
router.delete("/:id", authMiddleware, productsController.remove);

export default router;
