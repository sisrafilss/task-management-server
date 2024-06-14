require("dotenv").config();
const express = require("express");
const cors = require("cors");
var jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

function createToken(user) {
  const token = jwt.sign(
    {
      email: user.email,
    },
    "secret",
    { expiresIn: "100d" }
  );

  return token;
}

function verifyToken(req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  const verify = jwt.verify(token, "IsrafilHossen");
  if (!verify?.email) {
    return res.send("You are not authorized!");
  }
  req.user = verify.email;
  next();
}

const uri = process.env.DB_URL;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const usersDB = client.db("TaskManagerUsersDB");
    const tasksDB = client.db("TaskManagerTasksDB");
    const userCollection = usersDB.collection("userCollection");
    const tasksCollection = tasksDB.collection("tasksCollection");


    // user routes
    app.post("/user", async (req, res) => {
      const userData = req.body;
      if (!userData?.photoURL) {
        userData.photoURL = "";
      }
      userData.contactNumber = "";
      userData.address = "";
      userData.age = "";
      const token = createToken(userData);
      const isUserExists = await userCollection.findOne({
        email: userData.email,
      });

      if (isUserExists) {
        return res.send({
          status: "success",
          message: "Login success",
          token: token,
        });
      }
      await userCollection.insertOne(userData);
      res.send({ token });
    });
    app.get("/user/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      res.send(result);
    });

     // tasks routes | 
     app.post("/tasks", async (req, res) => {
      const taskData = req.body;
      const result = await tasksCollection.insertOne(taskData);
      res.send(result);
    });
    app.get("/tasks", async (req, res) => {
      const tasksData = tasksCollection.find();
      const result = await tasksData.toArray();
      res.send(result);
    });

    app.patch("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const updatedData = req.body;
      console.log("updated data", updatedData);
      const result = await tasksCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      );
      res.send(result);
    });

    app.delete("/tasks/:id", async (req, res) => {
      const id = req.params.id;
      const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });


   

    console.log("DB successfully connected!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("App is running!");
});

app.listen(port, () => {
  console.log("Server is running on port:", port);
});
