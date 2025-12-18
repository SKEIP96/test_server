import * as productsService from "./products.services.js";

/**
 * GET /products
 */
async function getAll(req, res, next) {
  try {
    const products = await productsService.getAll();
    res.json(products);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /products/:id
 */
async function getById(req, res, next) {
  try {
    const product = await productsService.getById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /products
 */
async function create(req, res, next) {
  try {
    const product = await productsService.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

export { getAll, getById, create };
