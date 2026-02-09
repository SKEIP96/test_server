import { Router } from "express";
import * as productsController from "./products.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { requireAdmin } from "../../middleware/requireAdmin.js";

const router = Router();

// public
router.get("/", productsController.list);
router.get("/:id", productsController.getById);

// protected (for now: any logged-in user can manage products)
router.post("/", authMiddleware,requireAdmin, productsController.create);
router.patch("/:id", authMiddleware,requireAdmin, productsController.update);
router.delete("/:id", authMiddleware,requireAdmin, productsController.remove);

export default router;
