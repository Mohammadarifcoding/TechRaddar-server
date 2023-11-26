const express = require("express");
const app = express();
const port = 5000;
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

// Tech_Raddar
// XOleI6J0sTpvXO6x

// MiddleWare
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pdvgnv8.mongodb.net/?retryWrites=true&w=majority`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const AllItem = client.db("Tech_Raddar").collection("AllProduct");
const Upvote = client.db("Tech_Raddar").collection("Upvote");
const Downvote = client.db("Tech_Raddar").collection("Downvote");
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    app.get("/featured", async (req, res) => {
      const query = {
        Featured: true,
        
       Status : true
      };
      const sortValue = {
        Date: -1,
      };
      const result = await AllItem.find(query).sort(sortValue).toArray();
      res.send(result);
    });

    // Vote related Api
    app.post("/upVote/:productId/:email", async (req, res) => {
      const email = req.params.email;
      const productId = req.params.productId;

      const body = { email, productId };
      const query = { email: email, productId: productId };
      const check = await Upvote.findOne(query);
      if (check) {
        const deleteResult = await Upvote.deleteOne(query);
        return res.send(deleteResult);
      }
      const result = await Upvote.insertOne(body);
      const deleteResult = await Downvote.deleteOne(query);

      

      res.send({ result, deleteResult });
    });
    app.post("/downVote/:productId/:email", async (req, res) => {
      const email = req.params.email;
      const productId = req.params.productId;

      const body = { email, productId };
      const query = { email: email, productId: productId };
      const check = await Downvote.findOne(query);
      if (check) {
        const deleteResult = await Downvote.deleteOne(query);
        return res.send(deleteResult)
      }
      const result = await Downvote.insertOne(body);
      const deleteResult = await Upvote.deleteOne(query);
      res.send({ result, deleteResult });
    });

    app.get("/upvoteData/:productId", async (req, res) => {
      const productId = req.params.productId;
      const query = { productId: productId };
      const result = await Upvote.find(query).toArray();
      
      
      res.send(result);
    });

    app.get("/downVoteData/:productId", async (req, res) => {
      const productId = req.params.productId;
      const query = { productId: productId };
      const result = await Downvote.find(query).toArray();
      res.send(result);
    });

    app.put('/updateUPVote/:productId',async(req,res)=>{
      const productId = req.params.productId;
      const body = req.body.vote
      const updateDoc = {
        $set : { 
         Up_Vote : body }
      }
      const filter = {Product_id : parseInt(productId)}
      const resultsecond = await AllItem.updateOne(filter,updateDoc)
      res.send(resultsecond)
    })


    // Trending Section

    app.get('/trending',async(req,res)=>{
      const query = { Up_Vote : -1 }
      const result = await AllItem.find({ Status : true }).sort(query).limit(6).toArray()
      res.send(result)
    })


    // Search Section
    app.post('/search',async(req,res)=>{
      const page = req.body.page
      const size = req.body.size
    const tag = req.body?.tagsList
    console.log(req.body.tagsList)
    if(req.body.tagsList.length == 0){
      const find = await AllItem.find({Status : true}).skip(page * size).limit(size).toArray()
      return res.send(find)
    }
    const arrayData = tag?.map(item => item.text)
    console.log(arrayData)
    const aggre = await AllItem.aggregate([
      {
        $match: {
              Tags : { $in: arrayData },
              Status: true
              
        }
      }
    ]).toArray()
    console.log(page,size)
    res.send(aggre)
    })

    app.get('/itemlength',async(req,res)=>{
      const result = await AllItem.estimatedDocumentCount()
      console.log(result)
      res.send({result})
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

// path
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
