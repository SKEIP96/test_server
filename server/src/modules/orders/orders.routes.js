const express = require("express");
const router = express.Router();

const ordersController = require("./orders.controller");

router.get("/", ordersController.getAll);

module.exports = router;
