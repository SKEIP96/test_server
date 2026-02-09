import "dotenv/config";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./app.js";
import { prisma } from "./src/libs/prisma.js";
import { startRefreshTokenCleanup } from "./src/cron/cleanupRefreshTokens.js";

const app = express();

// CORS
app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true,
}));

// Middleware
app.use(express.json()); 
app.use(cookieParser()); 

// Роуты
app.use(routes); // Все маршруты без префикса
// Пример: /auth/login, /products, /orders

// Обработка 404 для несуществующих маршрутов
app.use((req, res, next) => {
  res.status(404).json({
    message: "Route not found",
  });
});

// Глобальный обработчик ошибок (должен быть ПОСЛЕ всех маршрутов)
app.use((err, req, res, next) => {
  console.error(err);  // Логируем ошибку для разработки
  // http-errors использует err.status, а не err.statusCode
  const statusCode = err.status || err.statusCode || 500; 
  res.status(statusCode).json({
    message: err.message || "Something went wrong!",  
  });
});

// Запуск Prisma и cron
prisma.$connect()
  .then(() => console.log("Prisma connected"))
  .catch((err) => console.error("Prisma connection error:", err));

startRefreshTokenCleanup();

// Запуск сервера
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
