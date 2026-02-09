// src/middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import createError from "http-errors";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

export const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) throw createError(401, "Not authenticated");

    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = { id: payload.id };

    next();
  } catch (err) {
    if (err?.name === "TokenExpiredError") {
      return next(createError(401, "Access token expired"));
    }
    if (err?.name === "JsonWebTokenError") {
      return next(createError(401, "Invalid token"));
    }
    return next(err);
  }
};
