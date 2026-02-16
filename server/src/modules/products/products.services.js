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

export async function getPage({
  take = 12,
  page = 1,
  q = "",
  sort = "new",
  inStockOnly = false,
} = {}) {
  const takeN = take;   
  const pageN = page;
  const skipN = (pageN - 1) * takeN;

  const whereSearch =
    q && q.trim().length > 0
      ? { title: { contains: q.trim(), mode: "insensitive" } }
      : {};

  // сортировка внутри блоков (стабильная)
  let orderBy = [{ id: "desc" }];
  if (sort === "new") orderBy = [{ id: "desc" }];
  if (sort === "price_asc") orderBy = [{ price: "asc" }, { id: "asc" }];
  if (sort === "price_desc") orderBy = [{ price: "desc" }, { id: "desc" }];

  // если включена галочка — просто один блок (только in-stock)
  if (inStockOnly) {
    const rows = await prisma.product.findMany({
      where: { ...whereSearch, in_stock: { gt: 0 } },
      orderBy,
      skip: skipN,
      take: takeN + 1,
    });

    const hasMore = rows.length > takeN;
    const items = hasMore ? rows.slice(0, takeN) : rows;

    return { items: items.map(toProductDto), page: pageN, take: takeN, hasMore };
  }

  // ✅ 2 блока: сначала in-stock, потом out-of-stock
  const inStockCount = await prisma.product.count({
    where: { ...whereSearch, in_stock: { gt: 0 } },
  });

  // диапазон элементов, который мы хотим получить: [skipN .. skipN+takeN)
  const start = skipN;
  const end = skipN + takeN;

  // сколько берем из in-stock части
  const inStart = Math.min(start, inStockCount);
  const inEnd = Math.min(end, inStockCount);
  const inTake = Math.max(inEnd - inStart, 0);

  // сколько добираем из out-of-stock части
  const outTake = takeN - inTake;
  const outSkip = Math.max(start - inStockCount, 0);

  const [inRows, outRows] = await Promise.all([
    inTake > 0
      ? prisma.product.findMany({
          where: { ...whereSearch, in_stock: { gt: 0 } },
          orderBy,
          skip: inStart,
          take: inTake,
        })
      : Promise.resolve([]),

    outTake > 0
      ? prisma.product.findMany({
          where: { ...whereSearch, in_stock: { lte: 0 } },
          orderBy,
          skip: outSkip,
          take: outTake + 1, // ✅ +1 чтобы понять hasMore на хвосте
        })
      : Promise.resolve([]),
  ]);

  // hasMore: либо есть ещё in-stock дальше, либо есть ещё out-of-stock дальше
  // Если мы уже залезли в outRows, то hasMore проверяем по outRows length
  let hasMore = false;

  if (end < inStockCount) {
    // мы всё ещё внутри in-stock блока
    hasMore = true;
  } else {
    // мы дошли до out-of-stock блока — проверяем, есть ли ещё там
    hasMore = outRows.length > outTake;
  }

  const outRowsTrimmed = outRows.length > outTake ? outRows.slice(0, outTake) : outRows;
  const items = [...inRows, ...outRowsTrimmed];

  return {
    items: items.map(toProductDto),
    page: pageN,
    take: takeN,
    hasMore,
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
