import * as service from "./auth.service.js";
import { prisma } from "../../libs/prisma.js";

/**
 * REGISTER
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await service.register({ name, email, password });

    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
};

/**
 * LOGIN
 * - создаёт access + refresh
 * - кладёт оба в HttpOnly cookies
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { accessToken, refreshToken, user } =
      await service.login({ email, password });

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: false, // true в production
      sameSite: "lax",
      maxAge: 15 * 60 * 1000, // 15 минут
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false, // true в production
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    res.json({ user });
  } catch (e) {
    next(e);
  }
};

/**
 * REFRESH
 * - проверяет refresh token
 * - делает rotation
 * - выдаёт новые cookies
 */
export const refresh = async (req, res, next) => {
  try {
    const { refresh_token } = req.cookies;

    const { accessToken, refreshToken } =
      await service.refresh(refresh_token);

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Tokens refreshed" });
  } catch (e) {
    next(e);
  }
};

/**
 * LOGOUT
 * - удаляет refresh token из БД
 * - чистит cookies
 */
export const logout = async (req, res, next) => {
  try {
    const { refresh_token } = req.cookies;

    await service.logout(refresh_token);

    res.clearCookie("access_token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.json({ message: "Logged out" });
  } catch (e) {
    next(e);
  }
};

/**
 * ME
 * - возвращает текущего пользователя
 * - работает ТОЛЬКО через access token + middleware
 */
export const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    res.json(user);
  } catch (e) {
    next(e);
  }
};
