const express = require("express");
require("dotenv").config();
const app = express();
var cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 9000;
// middleware
app.use(cors());
app.use(express.json());
// token verify
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorize access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ASSESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden assess" });
    }
    req.decoded = decoded;
    next();
  });
}

// database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.3pzd9.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const database = client.db("powerHack");
    const billingListCollection = database.collection("billing-list");
    // Query for a movie that has the title 'The Room'

    /* ----------- get api create --------*/

    // get all billing-list
    app.get("/billing-list", verifyJWT, async (req, res) => {
      const query = {};
      const cursor = billingListCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

// routing setup
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`server running ${port}`);
});
