const express = require("express");
const app = express();
const port = 3000;

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("*", (req, res) => {
  const name = req.query.name || "World";
  res.send(`Hello, ${process.env.CONTAINER_REGISTRY_NAME || "World"}!`);
});

app.post("*", (req, res) => {
  res
    .status(200)
    .json({ msg: `Backend accepted your request: ${req.body.userMsg}` });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
