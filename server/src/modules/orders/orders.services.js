import prisma from "../../libs/prisma.js";

/**
 * Создание заказа с позициями
 * @param {number} userId
 * @param {Array<{ productId: number, quantity: number }>} items
 */
export async function createOrder({ userId, items }) {
  return prisma.$transaction(async (tx) => {
    // 1️⃣ создаём заказ
    const order = await tx.order.create({
      data: {
        user_id: userId,
      },
    });

    let total = 0;
    const resultItems = [];

    // 2️⃣ обрабатываем позиции
    for (const item of items) {
      const { productId, quantity } = item;

      if (!productId || quantity <= 0) {
        throw new Error("INVALID_ITEM_DATA");
      }

      // 3️⃣ берём товар
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new Error(`PRODUCT_NOT_FOUND_${productId}`);
      }

      if (product.in_stock < quantity) {
        throw new Error(`NOT_ENOUGH_STOCK_${product.title}`);
      }

      // 4️⃣ создаём позицию заказа
      await tx.orderItem.create({
        data: {
          order_id: order.id,
          product_id: productId,
          quantity,
        },
      });

      // 5️⃣ уменьшаем склад
      await tx.product.update({
        where: { id: productId },
        data: {
          in_stock: {
            decrement: quantity,
          },
        },
      });

      // 6️⃣ считаем сумму
      total += Number(product.price) * quantity;

      resultItems.push({
        productId,
        title: product.title,
        price: product.price,
        quantity,
      });
    }
    // 8️⃣ возвращаем осмысленный результат
    return {
      id: order.id,
      userId: order.user_id,
      total,
      items: resultItems,
    };
  });
}
