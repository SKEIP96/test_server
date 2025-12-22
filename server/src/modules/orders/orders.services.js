import prisma from "../../libs/prisma.js";
import createError from "http-errors";

/**
 * Создание заказа (транзакция)
 * @param {number} userId
 * @param {{ productId: number, quantity: number }[]} items
 */
export async function createOrder({ userId, items }) {
  return prisma.$transaction(async (tx) => {
    // 1️⃣ Создаём заказ
    const order = await tx.order.create({
      data: {
        user_id: userId,
      },
    });

    let total = 0;
    const resultItems = [];

    // 2️⃣ Обрабатываем позиции
    for (const item of items) {
      const { productId, quantity } = item;

      // 2.1 Валидация данных позиции
      if (!productId || quantity <= 0) {
        throw createError(400, "INVALID_ITEM_DATA");
      }

      // 2.2 Проверяем существование товара
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw createError(404, "PRODUCT_NOT_FOUND");
      }

      // 2.3 Проверяем склад
      if (product.in_stock < quantity) {
        throw createError(409, "NOT_ENOUGH_STOCK");
      }

      // 2.4 Создаём позицию заказа
      await tx.orderItem.create({
        data: {
          order_id: order.id,
          product_id: productId,
          quantity,
        },
      });

      // 2.5 Обновляем склад
      await tx.product.update({
        where: { id: productId },
        data: {
          in_stock: {
            decrement: quantity,
          },
        },
      });

      // 2.6 Считаем сумму
      total += Number(product.price) * quantity;

      resultItems.push({
        productId,
        title: product.title,
        price: product.price,
        quantity,
      });
    }

    // ❗ total НЕ сохраняем в БД
    // ❗ order.update НЕ нужен

    // 3️⃣ Возвращаем осмысленный результат
    return {
      id: order.id,
      userId: order.user_id,
      total,
      items: resultItems,
    };
  });
}
