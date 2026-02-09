import { Router } from "express";

import productsRoutes from "./src/modules/products/products.routes.js";
import ordersRoutes from "./src/modules/orders/orders.routes.js";
import currentOrderRoutes from "./src/modules/current-order/current-order.routes.js";
import authRoutes from "./src/modules/auth/auth.routes.js";

const router = Router();

router.get("/", (req, res) => {
  res.send("Server is running");
});

router.use("/auth", authRoutes);
router.use("/products", productsRoutes);
router.use("/orders/current", currentOrderRoutes);
router.use("/orders", ordersRoutes);


export default router;
