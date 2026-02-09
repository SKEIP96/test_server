import { prisma } from "../../libs/prisma.js";
import createError from "http-errors";

/**
 * Unified DTO mapping (same as current-order).
 * Difference is handled by pickUnitPriceForItem():
 * - CART uses product.price
 * - PAID/CANCELED uses order_item.price (snapshot)
 */

function toNumber(val) {
  return Number(val);
}

function pickUnitPriceForItem(orderStatus, orderItem) {
  if (orderStatus === "CART") return orderItem.product?.price;
  return orderItem.price;
}

function toOrderDto(order) {
  const items = (order.order_items ?? []).map((it) => {
    const unitPrice = pickUnitPriceForItem(order.status, it);

    return {
      id: it.id,
      quantity: it.quantity,
      product: it.product
        ? {
            id: it.product.id,
            title: it.product.title,
            price: unitPrice != null ? unitPrice.toString() : undefined,
          }
        : undefined,
    };
  });

  const itemsCount = items.reduce((sum, it) => sum + Number(it.quantity), 0);

  const total = (order.order_items ?? []).reduce((sum, it) => {
    const unitPrice = pickUnitPriceForItem(order.status, it);
    return sum + toNumber(unitPrice) * Number(it.quantity);
  }, 0);

  return {
    id: order.id,
    status: order.status,
    created_at: order.created_at,
    itemsCount,
    total,
    items,
  };
}

/**
 * List my orders history (PAID/CANCELED only)
 * Returns array of unified Order DTO
 */
export async function listMyOrders(userId) {
  if (!userId) throw createError(400, "userId is required");

  const orders = await prisma.order.findMany({
    where: {
      user_id: userId,
      status: { in: ["PAID", "CANCELED"] },
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      status: true,
      created_at: true,
      order_items: {
        select: {
          id: true,
          quantity: true,
          price: true, // snapshot
          product: {
            select: { id: true, title: true },
          },
        },
      },
    },
  });

  // For PAID/CANCELED, price comes from order_items.price and is placed into product.price in DTO.
  return orders.map((o) =>
    toOrderDto({
      ...o,
      order_items: o.order_items.map((it) => ({
        ...it,
        // ensure pickUnitPriceForItem has what it needs for PAID/CANCELED:
        // it.price exists, it.product exists (without price)
        product: it.product,
      })),
    })
  );
}

/**
 * Get my order by id (PAID/CANCELED only)
 * Returns unified Order DTO
 */
export async function getMyOrderById(userId, orderId) {
  if (!userId) throw createError(400, "userId is required");
  if (!orderId) throw createError(400, "orderId is required");

  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      user_id: userId,
      status: { in: ["PAID", "CANCELED"] },
    },
    select: {
      id: true,
      status: true,
      created_at: true,
      order_items: {
        select: {
          id: true,
          quantity: true,
          price: true, // snapshot
          product: { select: { id: true, title: true } },
        },
      },
    },
  });

  if (!order) throw createError(404, "Order not found");
  return toOrderDto(order);
}

/**
 * Checkout: CART -> PAID
 * - Validates cart exists and is non-empty
 * - Atomically decrements in_stock
 * - Writes snapshot price to order_items.price
 * - Updates order status to PAID
 * Returns unified Order DTO
 */
export async function checkoutOrder(userId) {
  if (!userId) throw createError(400, "userId is required");

  return prisma.$transaction(async (tx) => {
    // 1) Find current cart
    const cart = await tx.order.findFirst({
      where: { user_id: userId, status: "CART" },
      select: {
        id: true,
        status: true,
        created_at: true,
        order_items: {
          select: {
            id: true,
            product_id: true,
            quantity: true,
          },
        },
      },
    });

    if (!cart) throw createError(404, "Current order not found");
    if (!cart.order_items || cart.order_items.length === 0) {
      throw createError(400, "Current order is empty");
    }

    // 2) Stock decrement + snapshot price update per item
    for (const item of cart.order_items) {
      const product = await tx.product.findUnique({
        where: { id: item.product_id },
        select: { id: true, title: true, price: true, in_stock: true },
      });

      if (!product) throw createError(404, `Product not found: ${item.product_id}`);

      // Atomic decrement
      const dec = await tx.product.updateMany({
        where: { id: product.id, in_stock: { gte: item.quantity } },
        data: { in_stock: { decrement: item.quantity } },
      });

      if (dec.count !== 1) {
        throw createError(
          409,
          `Not enough stock for "${product.title}". Available: ${product.in_stock}, Required: ${item.quantity}`
        );
      }

      // Snapshot price on checkout
      await tx.orderItem.update({
        where: { id: item.id },
        data: { price: product.price },
      });
    }

    // 3) Update order status to PAID and return minimal fields
    const paidOrder = await tx.order.update({
      where: { id: cart.id },
      data: { status: "PAID" },
      select: {
        id: true,
        status: true,
        created_at: true,
        order_items: {
          select: {
            id: true,
            quantity: true,
            price: true, // snapshot (now updated)
            product: { select: { id: true, title: true } },
          },
        },
      },
    });

    return toOrderDto(paidOrder);
  });
}
