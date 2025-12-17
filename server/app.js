const express = require("express");

const productsRoutes = require("./src/modules/products/products.routes");
const ordersRoutes = require("./src/modules/orders/orders.routes");
const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/products", productsRoutes);
app.use("/orders", ordersRoutes);
module.exports = app;
