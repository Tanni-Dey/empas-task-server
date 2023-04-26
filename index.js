const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

//verfiy token
function verifyJwt(req, res, next) {
  const autheader = req.headers.authorization;
  if (!autheader) {
    return res.status(401).send({ message: "Unauthoried access" });
  }
  const userToken = autheader.split(" ")[1];
  jwt.verify(
    userToken,
    process.env.ACCESS_TOKEN_SECRET,
    function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      req.decoded = decoded;
      next();
    }
  );
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1tyqf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();

    //all colletction
    const bookCollection = client.db("powerhack").collection("books");

    //Jwt
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = await jwt.sign(
        user,
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "2d",
        }
      );
      res.send({ accessToken });
    });

    // all book list
    app.get("/books", verifyJwt, async (req, res) => {
      let allBook;
      const searchText = req.query.search;
      if (searchText === "") {
        const query = {};
        const cursor = bookCollection.find(query);
        allBook = await cursor.toArray(cursor);
      } else {
        const queryByName = { name: searchText };
        const cursor = bookCollection.find(queryByName);
        if ((await bookCollection.countDocuments(queryByName)) !== 0) {
          allBook = await cursor.toArray(cursor);
        } else {
          const queryByAuthor = { author: searchText };
          const cursorByAuthor = bookCollection.find(queryByAuthor);
          allBook = await cursorByAuthor.toArray(cursorByAuthor);
        }
      }
      res.send(allBook);
    });

    // post book
    app.post("/books", async (req, res) => {
      const newBook = req.body;
      const addBook = await bookCollection.insertOne(newBook);
      res.send(addBook);
    });

    //book data delete
    app.delete("/book/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const deleteBook = await bookCollection.deleteOne(query);
      res.send(deleteBook);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Job Task");
});

app.listen(port, () => {
  console.log("Job Task Connected", port);
});
