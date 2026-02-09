import { listMyOrders, getMyOrderById } from "./orders.services.js";

/**
 * GET /orders
 * Orders history (PAID/CANCELED only)
 * Returns: OrderDto[]
 */
export async function list(req, res, next) {
  try {
    const userId = req.user.id;

    const orders = await listMyOrders(userId);
    res.json(orders);
  } catch (e) {
    next(e);
  }
}

/**
 * GET /orders/:id
 * Returns: OrderDto
 */
export async function getById(req, res, next) {
  try {
    const userId = req.user.id;
    const orderId = Number(req.params.id);

    const order = await getMyOrderById(userId, orderId);
    res.json(order);
  } catch (e) {
    next(e);
  }
}
