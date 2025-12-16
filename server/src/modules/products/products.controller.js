const productsService = require("./products.services");

async function getAllProducts(req, res) {
  const products = await productsService.getAll();
  res.json(products);
}

async function getProductById(req, res) {
  const id = Number(req.params.id);
  const product = await productsService.getById(id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  res.json(product);
}

async function createProduct(req, res) {
  const { name, price } = req.body;

  if (!name || price == null) {
    return res.status(400).json({ message: "name и price обязательны" });
  }

  const product = await productsService.create({ name, price });
  res.status(201).json(product);
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
};
