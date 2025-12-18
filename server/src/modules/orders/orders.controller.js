import { createOrder } from "./orders.services.js";

export async function create(req, res) {
  try {
    const { userId, items } = req.body;

    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "INVALID_REQUEST_DATA",
      });
    }

    const order = await createOrder({ userId, items });

    return res.status(201).json(order);
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
}
