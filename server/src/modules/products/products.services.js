// src/modules/products/products.services.js

let products = [
    { id: 1, name: "Keyboard", price: 100 },
    { id: 2, name: "Mouse", price: 50 },
  ];
  
  function getAll() {
    return products;
  }
  
  function getById(id) {
    return products.find((p) => p.id === id);
  }
  
  function create({ name, price }) {
    const product = {
      id: Date.now(),
      name,
      price,
    };
  
    products.push(product);
    return product;
  }
  
  module.exports = {
    getAll,
    getById,
    create,
  };
  