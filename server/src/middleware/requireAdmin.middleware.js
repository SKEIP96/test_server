import createError from "http-errors";
import { prisma } from "../libs/prisma.js";

export const requireAdmin = async (req, res, next) => {
  try {
    // req.user уже есть (его кладёт auth middleware)
    const userId = req.user?.id;
    if (!userId) {
      throw createError(401, "Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      throw createError(403, "Admin access required");
    }

    next();
  } catch (e) {
    next(e);
  }
};
