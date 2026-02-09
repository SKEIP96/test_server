import * as productsService from "./products.services.js";

/**
 * GET /products
 */
export async function list(req, res, next) {
  try {
    const take = Math.min(Math.max(Number(req.query.take ?? 12), 1), 50);
    const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
    const q = req.query.q ? String(req.query.q).trim() : "";
    const sortRaw = String(req.query.sort ?? "new");
    const sort = ["new", "price_asc", "price_desc", "stock_desc"].includes(sortRaw)
      ? sortRaw
      : "new";

    const result = await productsService.getPage({ take, cursor, q, sort });
    res.json(result);
  } catch (error) {
    next(error);
  }
}


/**
 * GET /products/:id
 */
export async function getById(req, res, next) {
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
export async function create(req, res, next) {
  try {
    const product = await productsService.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /products/:id
 */
export async function update(req, res, next) {
  try {
    const product = await productsService.updateById(req.params.id, req.body);
    res.json(product);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /products/:id
 */
export async function remove(req, res, next) {
  try {
    const product = await productsService.deleteById(req.params.id);
    res.json(product);
  } catch (error) {
    next(error);
  }
}
