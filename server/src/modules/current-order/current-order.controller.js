import {
  getCurrentOrder,
  addItemToCurrentOrder,
  setCurrentOrderItemQty,
  checkoutCurrentOrder,
} from "./current-order.services.js";

/**
 * GET /orders/current
 * Returns unified Order DTO (status CART)
 */
export async function get(req, res, next) {
  try {
    const userId = req.user.id;

    const order = await getCurrentOrder(userId);
    res.json(order);
  } catch (e) {
    next(e);
  }
}

/**
 * POST /orders/current/items
 * Body: { productId, quantity? }
 * Returns unified Order DTO (updated current order)
 */
export async function addItem(req, res, next) {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    const order = await addItemToCurrentOrder({
      userId,
      productId: Number(productId),
      quantity: quantity === undefined ? 1 : Number(quantity),
    });

    res.json(order);
  } catch (e) {
    next(e);
  }
}

/**
 * PATCH /orders/current/items/:productId
 * Body: { quantity }
 * - quantity = 0 => remove item
 * Returns unified Order DTO (updated current order)
 */
export async function setItemQty(req, res, next) {
  try {
    const userId = req.user.id;
    const productId = Number(req.params.productId);
    const { quantity } = req.body;

    const order = await setCurrentOrderItemQty({
      userId,
      productId,
      quantity: Number(quantity),
    });

    res.json(order);
  } catch (e) {
    next(e);
  }
}

/**
 * POST /orders/current/checkout
 * No body required
 * Returns unified Order DTO (status PAID)
 */
export async function checkout(req, res, next) {
  try {
    const userId = req.user.id;

    const order = await checkoutCurrentOrder({ userId });
    res.json(order);
  } catch (e) {
    next(e);
  }
}
