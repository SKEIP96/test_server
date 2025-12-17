const prisma = require("../../libs/prisma");

/**
 * Получить все продукты
 */
async function getAll() {
  return prisma.products.findMany({
    orderBy: {
      id: "asc",
    },
  });
}

/**
 * Получить продукт по id
 */
async function getById(id) {
  return prisma.products.findUnique({
    where: {
      id: Number(id),
    },
  });
}

/**
 * Создать продукт
 */
async function create({ title, price }) {
  return prisma.products.create({
    data: {
      title,
      price,
    },
  });
}

module.exports = {
  getAll,
  getById,
  create,
};
