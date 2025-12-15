// server.js
const app = require("./app");

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
