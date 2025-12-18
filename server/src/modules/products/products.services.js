import { prisma } from "../../libs/prisma.js";

async function getAll() {
  return prisma.product.findMany({
    orderBy: {
      id: "asc",
    },
  });
}

/**
 * Получить продукт по id
 */
async function getById(id) {
  return prisma.product.findUnique({
    where: {
      id: Number(id),
    },
  });
}

async function create({ title, price }) {
  return prisma.product.create({
    data: {
      title,
      price,
    },
  });
}


export { getAll, getById, create };
