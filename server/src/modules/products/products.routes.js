// src/modules/products/products.routes.js
const express = require("express");
const router = express.Router();

const productsController = require("./products.controller");

router.get("/", productsController.getAllProducts);
router.get("/:id", productsController.getProductById);
router.post("/", productsController.createProduct);

module.exports = router;

