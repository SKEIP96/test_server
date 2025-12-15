// src/modules/products/products.controller.js
const productsService = require("./products.services");

function getAllProducts(req, res) {
  const products = productsService.getAll();
  res.json(products);
}

function getProductById(req, res) {
  const id = Number(req.params.id);
  const product = productsService.getById(id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
}

function createProduct(req, res) {
  const { name, price } = req.body;

  if (!name || price == null) {
    return res.status(400).json({ message: "name и price обязательны" });
  }

  const product = productsService.create({ name, price });
  res.status(201).json(product);
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
};
