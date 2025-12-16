require("dotenv").config();
require("./src/libs/db");

const express = require("express");
const app = express();

const routes = require("./app");

app.use(express.json());
app.use(routes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
