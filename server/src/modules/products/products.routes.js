import { Router } from "express";
import * as productsController from "./products.controller.js";

const router = Router();

router.get("/", productsController.getAll);
router.get("/:id", productsController.getById);
router.post("/", productsController.create);

export default router;