import { prisma } from "../../libs/prisma.js";
import createError from "http-errors";

function toProductDto(p) {
  if (!p) return null;

  return {
    id: p.id,
    title: p.title,
    price: p.price.toString(),     // Decimal -> string
    in_stock: p.in_stock,
  };
}

function normalizeCreateInput({ title, price, inStock, in_stock }) {
  // support both inStock and in_stock from clients
  const stock = in_stock ?? inStock ?? 0;

  return {
    title: typeof title === "string" ? title.trim() : title,
    price,
    in_stock: stock,
  };
}

function normalizeUpdateInput({ title, price, inStock, in_stock }) {
  const data = {};

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length === 0) {
      throw createError(400, "title must be a non-empty string");
    }
    data.title = title.trim();
  }

  if (price !== undefined) {
    // allow string or number, prisma Decimal accepts string
    const priceStr = typeof price === "number" ? String(price) : String(price);
    if (!Number.isFinite(Number(priceStr)) || Number(priceStr) < 0) {
      throw createError(400, "price must be a number >= 0");
    }
    data.price = priceStr;
  }

  const stock = in_stock ?? inStock;
  if (stock !== undefined) {
    const n = Number(stock);
    if (!Number.isInteger(n) || n < 0) {
      throw createError(400, "in_stock must be an integer >= 0");
    }
    data.in_stock = n;
  }

  return data;
}

export async function getAll() {
  const products = await prisma.product.findMany({
    orderBy: { id: "asc" },
  });

  return products.map(toProductDto);
}

export async function getPage({ take = 12, cursor, q = "", sort = "new" } = {}) {
  const where =
    q && q.trim().length > 0
      ? { title: { contains: q.trim(), mode: "insensitive" } }
      : {};

  // стабильная сортировка 
  const prefix = [{ in_stock: "desc" }];

// стабильная сортировка + выбранный критерий
let orderBy = [...prefix, { id: "desc" }];

if (sort === "new") orderBy = [...prefix, { id: "desc" }]; // пока нет created_at
if (sort === "price_asc") orderBy = [...prefix, { price: "asc" }, { id: "asc" }];
if (sort === "price_desc") orderBy = [...prefix, { price: "desc" }, { id: "desc" }];
// если ты всё ещё держишь "stock_desc" как сортировку — она по сути совпадает с prefix
if (sort === "stock_desc") orderBy = [...prefix, { id: "desc" }];

  const rows = await prisma.product.findMany({
    where,
    orderBy,
    take: take + 1, // берём на 1 больше
    ...(cursor ? { cursor: { id: Number(cursor) }, skip: 1 } : {}),
  });

  const hasNext = rows.length > take;
  const pageRows = hasNext ? rows.slice(0, take) : rows;

  return {
    items: pageRows.map(toProductDto),
    nextCursor: hasNext ? pageRows[pageRows.length - 1]?.id ?? null : null,
  };
}


export async function getById(id) {
  const product = await prisma.product.findUnique({
    where: { id: Number(id) },
  });

  return toProductDto(product);
}

export async function create(payload) {
  const { title, price, in_stock } = normalizeCreateInput(payload);

  if (typeof title !== "string" || title.trim().length === 0) {
    throw createError(400, "title is required");
  }

  if (price === undefined || price === null) {
    throw createError(400, "price is required");
  }

  const priceStr = typeof price === "number" ? String(price) : String(price);
  if (!Number.isFinite(Number(priceStr)) || Number(priceStr) < 0) {
    throw createError(400, "price must be a number >= 0");
  }

  const stockNum = Number(in_stock);
  if (!Number.isInteger(stockNum) || stockNum < 0) {
    throw createError(400, "in_stock must be an integer >= 0");
  }

  const created = await prisma.product.create({
    data: {
      title: title.trim(),
      price: priceStr,
      in_stock: stockNum,
    },
  });

  return toProductDto(created);
}

export async function updateById(id, payload) {
  const productId = Number(id);
  if (!productId) throw createError(400, "id is required");

  const data = normalizeUpdateInput(payload);
  if (Object.keys(data).length === 0) {
    throw createError(400, "No fields to update");
  }

  try {
    const updated = await prisma.product.update({
      where: { id: productId },
      data,
    });

    return toProductDto(updated);
  } catch (e) {
    // Prisma throws if record not found
    throw createError(404, "Product not found");
  }
}

export async function deleteById(id) {
  const productId = Number(id);
  if (!productId) throw createError(400, "id is required");

  try {
    const deleted = await prisma.product.delete({
      where: { id: productId },
    });

    return toProductDto(deleted);
  } catch (e) {
    throw createError(404, "Product not found");
  }
}
