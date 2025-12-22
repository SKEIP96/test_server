import "dotenv/config";

import express from "express";
import routes from "./app.js";
import { prisma } from "./src/libs/prisma.js";
import { errorHandler } from "./src/middleware/error.middleware.js";

const app = express();

app.use(express.json());
app.use(routes);

// error handler — ВСЕГДА В КОНЦЕ
app.use(errorHandler);

// Инициализация Prisma
prisma.$connect()
  .then(() => console.log("Prisma connected"))
  .catch((err) => console.error("Prisma connection error:", err));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
