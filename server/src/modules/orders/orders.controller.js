import { createOrder } from "./orders.services.js";

/**
 * POST /orders
 */
export async function create(req, res, next) {
  try {
    const { userId, items } = req.body;

    // Базовая проверка запроса (структура)
    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "INVALID_REQUEST_DATA",
      });
    }

    const order = await createOrder({ userId, items });

    res.status(201).json(order);
  } catch (err) {
    // ❗ ВСЕ ошибки уходим в error middleware
    next(err);
  }
}
