import { Router } from "express";

import productsRoutes from "./src/modules/products/products.routes.js";
import ordersRoutes from "./src/modules/orders/orders.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.send("Server is running");
});

router.use("/products", productsRoutes);
router.use("/orders", ordersRoutes);

export default router;
