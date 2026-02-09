import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../libs/prisma.js";
import createError from "http-errors";

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

export const register = async ({ name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw createError(409, "Email already in use");
  }

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hash },
    select: { id: true, name: true, email: true },
  });

  return user;
};

export const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw createError(401, "Invalid email or password");
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw createError(401, "Invalid email or password");
  }

  const accessToken = jwt.sign(
    { id: user.id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      user_id: user.id,
      expires_at: expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
};

export const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw createError(401, "Refresh token missing");
  }

  let payload;
  try {
    payload = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch {
    throw createError(401, "Invalid refresh token");
  }

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken) {
    throw createError(401, "Refresh token revoked");
  }

  // rotation — удаляем старый
  await prisma.refreshToken.delete({
    where: { token: refreshToken },
  });

  const newAccessToken = jwt.sign(
    { id: payload.id },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_EXPIRES_IN }
  );

  const newRefreshToken = jwt.sign(
    { id: payload.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      user_id: payload.id,
      expires_at: expiresAt,
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logout = async (refreshToken) => {
  if (!refreshToken) return;

  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken },
  });
};
