const express = require("express");
require("dotenv").config();
const app = express();
var cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
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
    const usersCollection = database.collection("users");

    /* ----------- api create --------*/
    // registration
    app.post("/registration", async (req, res) => {
      const userData = req.body;
      const query = { email: userData.email };
      const isEmailExist = await usersCollection.findOne(query);

      if (isEmailExist === null) {
        const result = await usersCollection.insertOne(userData);
        // create token
        const accessToken = jwt.sign(
          { email: userData.email },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "1d",
          }
        );
        // registration successfully
        if (result.acknowledged) {
          res.send({ accessToken: accessToken, user: userData });
        } else {
          res.send({ errorMessage: "registration failed" });
        }
      } else {
        res.send({ errorMessage: "email address already exist" });
      }
    });
    // login
    app.post("/login", async (req, res) => {
      const userData = req.body;
      const query = { email: userData.email };
      const result = await usersCollection.findOne(query);

      if (
        result.email === userData.email &&
        result.password === userData.password
      ) {
        // create token
        const accessToken = jwt.sign(
          { email: userData.email },
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "1d",
          }
        );
        // login successfully
        res.send({ accessToken: accessToken, user: result });
      } else {
        res.send({ errorMessage: "email address and password does not match" });
      }
    });
    // get all billing-list
    app.get("/billing-list", verifyJWT, async (req, res) => {
      const pageNumber = Number(req.query.pageNumber);
      const query = {};
      const cursor = billingListCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    // post  billing-list
    app.post("/billing-list", verifyJWT, async (req, res) => {
      const billingInfo = req.body;
      const result = await billingListCollection.insertOne(billingInfo);
      res.send(result);
    });
    // patch all billing-list
    app.patch("/billing-list/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: updateData,
      };
      const result = await billingListCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });
    // delete billing-list
    app.delete("/billing-list/:id", verifyJWT, async (req, res) => {
      const id = req.params;
      const query = { _id: ObjectId(id) };
      const result = await billingListCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

// routing setup
app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`server running ${port}`);
});
