import { prisma } from "../../libs/prisma.js";
import createError from "http-errors";
import { checkoutOrder } from "../orders/orders.services.js";

/**
 * Helpers: price/total calculation and unified DTO mapping
 */

function toNumber(val) {
  // Prisma Decimal can be string-like; convert safely for totals.
  return Number(val);
}

function pickUnitPriceForItem(orderStatus, orderItem) {
  // CART: always show current product.price (actual)
  // PAID/CANCELED: show snapshot orderItem.price
  if (orderStatus === "CART") return orderItem.product?.price;
  return orderItem.price;
}

function toOrderDto(order) {
  if (!order) return null;

  const items = (order.order_items ?? []).map((it) => {
    const unitPrice = pickUnitPriceForItem(order.status, it);

    return {
      id: it.id,
      quantity: it.quantity,
      product: it.product
        ? {
            id: it.product.id,
            title: it.product.title,
            // Always provide price inside product
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
 * Find or create current order (Order with status CART)
 */
export async function getOrCreateCurrentOrder(tx, userId) {
  if (!userId) throw createError(400, "userId is required");

  const user = await tx.user.findUnique({ where: { id: userId } });
  if (!user) throw createError(404, "User not found");

  let current = await tx.order.findFirst({
    where: { user_id: userId, status: "CART" },
    select: { id: true },
  });

  if (!current) {
    try {
      current = await tx.order.create({
        data: { user_id: userId, status: "CART" },
        select: { id: true },
      });
    } catch (e) {
      // If another parallel request created it first, re-read
      current = await tx.order.findFirst({
        where: { user_id: userId, status: "CART" },
        select: { id: true },
      });
      if (!current) throw e;
    }
  }

  return current;
}

/**
 * Get current order (CART)
 * Returns unified Order DTO (same format as PAID/CANCELED orders)
 */
export async function getCurrentOrder(userId) {
  if (!userId) throw createError(400, "userId is required");

  return prisma.$transaction(async (tx) => {
    const current = await getOrCreateCurrentOrder(tx, userId);

    const order = await tx.order.findUnique({
      where: { id: current.id },
      select: {
        id: true,
        status: true,
        created_at: true,
        order_items: {
          select: {
            id: true,
            quantity: true,
            // keep snapshot too (not used for CART DTO price, but useful elsewhere)
            price: true,
            product: {
              select: { id: true, title: true, price: true },
            },
          },
        },
      },
    });

    if (!order) throw createError(404, "Current order not found");

    return toOrderDto(order);
  });
}

/**
 * Add product to current order (upsert + stock validation)
 * Returns unified Order DTO (current order)
 */
export async function addItemToCurrentOrder({ userId, productId, quantity = 1 }) {
  if (!userId || !productId) throw createError(400, "userId and productId required");
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw createError(400, "quantity must be integer > 0");
  }

  return prisma.$transaction(async (tx) => {
    const current = await getOrCreateCurrentOrder(tx, userId);

    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { id: true, title: true, price: true, in_stock: true },
    });
    if (!product) throw createError(404, "Product not found");

    const existing = await tx.orderItem.findUnique({
      where: { order_id_product_id: { order_id: current.id, product_id: productId } },
      select: { quantity: true },
    });

    const existingQty = existing?.quantity ?? 0;
    const newQty = existingQty + quantity;

    if (product.in_stock < newQty) {
      throw createError(
        409,
        `Not enough stock. Available: ${product.in_stock}, In order: ${existingQty}, Requested add: ${quantity}`
      );
    }

    await tx.orderItem.upsert({
      where: { order_id_product_id: { order_id: current.id, product_id: productId } },
      create: {
        order_id: current.id,
        product_id: productId,
        quantity,
        // Keep snapshot updated too (handy; final snapshot is enforced on checkout anyway)
        price: product.price,
      },
      update: {
        quantity: { increment: quantity },
        price: product.price,
      },
    });

    const order = await tx.order.findUnique({
      where: { id: current.id },
      select: {
        id: true,
        status: true,
        created_at: true,
        order_items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: { select: { id: true, title: true, price: true } },
          },
        },
      },
    });

    if (!order) throw createError(404, "Current order not found");
    return toOrderDto(order);
  });
}

/**
 * Set item quantity in current order (0 => delete)
 * Returns unified Order DTO
 */
export async function setCurrentOrderItemQty({ userId, productId, quantity }) {
  if (!userId || !productId) throw createError(400, "userId and productId required");
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw createError(400, "quantity must be integer >= 0");
  }

  return prisma.$transaction(async (tx) => {
    const current = await getOrCreateCurrentOrder(tx, userId);

    if (quantity === 0) {
      await tx.orderItem.deleteMany({
        where: { order_id: current.id, product_id: productId },
      });
    } else {
      const product = await tx.product.findUnique({
        where: { id: productId },
        select: { id: true, title: true, price: true, in_stock: true },
      });
      if (!product) throw createError(404, "Product not found");
      if (product.in_stock < quantity) {
        throw createError(409, `Not enough stock. Available: ${product.in_stock}, Required: ${quantity}`);
      }

      await tx.orderItem.upsert({
        where: { order_id_product_id: { order_id: current.id, product_id: productId } },
        create: {
          order_id: current.id,
          product_id: productId,
          quantity,
          price: product.price,
        },
        update: {
          quantity,
          price: product.price,
        },
      });
    }

    const order = await tx.order.findUnique({
      where: { id: current.id },
      select: {
        id: true,
        status: true,
        created_at: true,
        order_items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            product: { select: { id: true, title: true, price: true } },
          },
        },
      },
    });

    if (!order) throw createError(404, "Current order not found");
    return toOrderDto(order);
  });
}

/**
 * Checkout current order (CART -> PAID)
 * Delegates to orders.checkoutOrder and returns the same unified Order DTO
 */
export async function checkoutCurrentOrder({ userId }) {
  if (!userId) throw createError(400, "userId is required");
  return checkoutOrder(userId);
}
