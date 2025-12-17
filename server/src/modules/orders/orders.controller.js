const ordersService = require("./orders.services");

/**
 * GET /orders
 */
async function getAll(req, res, next) {
  try {
    const orders = await ordersService.getAllOrders();
    res.json(orders);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAll,
};
