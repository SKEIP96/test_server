const express = require("express");
const router = express.Router();

const productsRoutes = require("./src/modules/products/products.routes");

router.get("/", (req, res) => {
  res.send("Server is running");
});

router.use("/products", productsRoutes);

module.exports = router;
