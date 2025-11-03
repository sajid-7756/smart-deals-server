const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@smartdeals.nfbp4pd.mongodb.net/?appName=SmartDeals`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Smart server is running!");
});

async function run() {
  try {
    await client.connect();

    const db = client.db("smart_db");
    const productsCollection = db.collection("products");
    const bidsCollection = db.collection("bids");
    const usersCollection = db.collection("users");

    //user related apis
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const email = newUser.email;

      const query = { email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: "User already exist" });
      }
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    //products related apis
    app.get("/products", async (req, res) => {
      // const projectFields = { title: 1 };
      // const query = productsCollection
      //   .find() // find all data
      //   .sort({ price_min: 1 }) //sorting as price -1 (dicending)
      //   .skip(1) //skip first 1 data
      //   .limit(5) // limiting data only first 5 data will exist
      //   .project(projectFields); // only project fields exits no more property

      const email = req.query.email;
      const query = {};

      if (email) {
        query.email = email;
      }

      const cursor = productsCollection.find(query);

      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/latest-products", async (req, res) => {
      const projectFields = { title: 1, price_min: 1, price_max: 1, image: 1 };

      const cursor = productsCollection
        .find()
        .sort({
          created_at: -1,
        })
        .limit(6)
        .project(projectFields);

      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(query);
      res.send(result);
    });

    app.post("/products", async (req, res) => {
      const newProduct = req.body;
      const result = await productsCollection.insertOne(newProduct);
      res.send(result);
    });

    app.patch("/products/:id", async (req, res) => {
      const id = req.params.id;
      const updatedProduct = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          name: updatedProduct.name,
          price: updatedProduct.price,
        },
      };
      const options = {};
      const result = await productsCollection.updateOne(query, update, options);
      res.send(result);
    });

    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    //bids related apis
    app.get("/bids", async (req, res) => {
      const email = req.query.email;
      const query = {};

      if (email) {
        query.buyer_email = email;
      }

      const cursor = bidsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/bids/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = bidsCollection.findOne(query);
      res.send(result);
    });

    app.get("/products/bids/:productId", async (req, res) => {
      const productId = req.params.productId;
      const query = { product: productId };
      const cursor = bidsCollection.find(query).sort({ bid_price: -1 });
      const result = await cursor.toArray();
      res.send(result);
    });

    app.post("/bids", async (req, res) => {
      const newBids = req.body;
      const result = await bidsCollection.insertOne(newBids);
      res.send(result);
    });

    app.delete("/bids/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bidsCollection.deleteOne(query);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

// client
//   .connect()
//   .then(() => {
//     app.listen(port, () => {
//       console.log(`App listening on port ${port}`);
//     });
//   })
//   .catch(console.dir);
