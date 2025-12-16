const pool = require("../../libs/db");

// получить все продукты
async function getAll() {
  const { rows } = await pool.query(
    "SELECT id, name, price FROM products ORDER BY id ASC"
  );
  return rows;
}

// получить продукт по id
async function getById(id) {
  const { rows } = await pool.query(
    "SELECT id, name, price FROM products WHERE id = $1",
    [id]
  );
  return rows[0];
}

// создать продукт
async function create({ name, price }) {
  const { rows } = await pool.query(
    "INSERT INTO products (name, price) VALUES ($1, $2) RETURNING id, name, price",
    [name, price]
  );
  return rows[0];
}

module.exports = {
  getAll,
  getById,
  create,
};
