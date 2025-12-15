// app.js
const express = require("express");

const productsRoutes = require("./src/modules/products/products.routes");

const app = express();

// глобальные middleware
app.use(express.json());

// базовый health-check
app.get("/", (req, res) => {
  res.send("Server is running");
});

// модули
app.use("/products", productsRoutes);

module.exports = app;
