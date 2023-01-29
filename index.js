const express = require("express");
require("dotenv").config();
const app = express();
var cors = require("cors");
const port = process.env.PORT || 9000;
// middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`server running ${port}`);
});
