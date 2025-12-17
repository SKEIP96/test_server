const prisma = require("../../libs/prisma");

/**
 * Получить все заказы вместе с товарами
 */
async function getAllOrders() {
  return prisma.order.findMany({
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });
}

module.exports = {
  getAllOrders,
};
