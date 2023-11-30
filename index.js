const express = require("express");
const app = express();
const port = 5000;
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require('stripe')(process.env.STRIPE)
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
const User = client.db("Tech_Raddar").collection("User");
const Reported = client.db("Tech_Raddar").collection("Reported");
const ReViewed = client.db("Tech_Raddar").collection("Reviews");
const Payment = client.db("Tech_Raddar").collection("Payment");
const Coupon = client.db("Tech_Raddar").collection("Coupon");
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
   


  //  Verify Token

  const verifyToken = (req,res,next)=>{
    console.log(req.headers)
    console.log(req.headers.authorization)
    if(!req.headers.authorization){
      return res.status(401).send({ message : 'No accesss'})
    }
    const token = req.headers.authorization.split(' ')[1]
    jwt.verify(token,"fffff", function (err,decoded){
      if(err){
        return res.status(401).send({ message : "Forbidden Access"})
      }
      req.decoded = decoded
      next()
    })
  }


    // user data insert

    app.post("/users", async (req, res) => {
      const email = req.body.email;
      const name = req.body.name
      
      const find = await User.findOne({ email: email });
      
      if (find) {
        return res.send({ message: "Already user registred" });
      }
      const data = { email: email , role:'User' , name:name };
      
      const result = await User.insertOne(data);
      res.send(result);
    });

    //  jwt token

    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, "fffff", { expiresIn: "1hr" });
      res.send({ token });
    });

    app.get("/featured", async (req, res) => {
      const query = {
        Featured: true,
        Status:"Accepted"
      };
      const sortValue = {
        Date: -1,
      };
      const result = await AllItem.find(query).sort(sortValue).toArray();
      res.send(result);
    });

    // Vote related Api
    app.post("/upVote/:productId/:email/:owner_email", async (req, res) => {
      const email = req.params.email;
      const productId = req.params.productId;
      const Owner_email = req.params.owner_email;

      const body = { email, productId ,Owner_email};
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
    app.post("/downVote/:productId/:email/:owner_email", async (req, res) => {
      const email = req.params.email;
      const productId = req.params.productId;
      const Owner_email = req.params.owner_email;


      const body = { email, productId ,Owner_email};
      const query = { email: email, productId: productId };
      const check = await Downvote.findOne(query);
      if (check) {
        const deleteResult = await Downvote.deleteOne(query);
        return res.send(deleteResult);
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

    app.put("/updateUPVote/:productId", async (req, res) => {
      const productId = req.params.productId;
      const body = req.body.vote;
      const updateDoc = {
        $set: {
          Up_Vote: body,
        },
      };
      const filter = { Product_id: parseInt(productId) };
      const resultsecond = await AllItem.updateOne(filter, updateDoc);
      res.send(resultsecond);
    });

    // Trending Section

    app.get("/trending", async (req, res) => {
      const query = { Up_Vote: -1 };
      const result = await AllItem.find({ Status:"Accepted" })
        .sort(query)
        .limit(6)
        .toArray();
      res.send(result);
    });

    // Search Section
    app.post("/search", async (req, res) => {
      const page = req.body.page;
      const size = req.body.size;
      const tag = req.body?.tagsList;
      console.log(req.body.tagsList);
      if (req.body.tagsList.length == 0) {
        const find = await AllItem.find({ Status:"Accepted" })
          .skip(page * size)
          .limit(size)
          .toArray();
        return res.send(find);
      }
      const arrayData = tag?.map((item) => item.text);
      console.log(arrayData);
      const aggre = await AllItem.aggregate([
        {
          $match: {
            Tags: { $in: arrayData },
            Status:"Accepted"
          },
        },
      ]).toArray();
      console.log(page, size);
      res.send(aggre);
    });

    app.get("/itemlength", async (req, res) => {
      const result = await AllItem.estimatedDocumentCount();
      console.log(result);
      res.send({ result });
    });


    // product details data
    app.get('/products/:productId',async(req,res)=>{
      const productId = req.params.productId
      const query = {Product_id : parseInt(productId)}
      const result = await AllItem.findOne(query)
      res.send(result)
    })
    // Send a ping to confirm a successful connection
   

    // update product get data 
    app.get('/updateProductGet/:productId',async(req,res)=>{
      const productId = req.params.productId
      const query = {Product_id : parseInt(productId)}
      const result = await AllItem.findOne(query)
      res.send(result)
    })

    // Report about product

    app.post('/reported',async(req,res)=>{
      const item = req.body
      const result = await Reported.insertOne(item)
      res.send(result)
    })

   
    // Post Review
    app.post('/review',async(req,res)=>{
      const review = req.body
      const result = await ReViewed.insertOne(review)
      res.send(result)
    }) 

    // get review
    app.get('/review/:productId',async(req,res)=>{
      const productId = req.params.productId
      const query = {productId : parseInt(productId)}
      const result = await ReViewed.find(query).toArray()
      res.send(result)
    })

  //  Dashboard

  // my profile

  app.get('/myProfile/:email',async(req,res)=>{
    
    const email = req.params.email
    const productsCount = await AllItem.countDocuments({ Owner_email: email });

    const upvotesCount = await Upvote.countDocuments({ Owner_email: email });

    const downvotesCount = await Downvote.countDocuments({ Owner_email: email });

    const result = {
      products: productsCount,
      upvotes: upvotesCount,
      downvotes: downvotesCount
    };
    res.send(result)
  })


  // Add Product
  app.post('/products',async(req,res)=>{
    const body = req.body
    const result = await AllItem.insertOne(body)
    res.send(result)
  })

  // Create Payment instance

  app.post('/create-payment-intent',async(req,res)=>{
    const {totalPayment} = req.body
    
    const amount = parseInt(totalPayment * 100)
    console.log(amount)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency : 'usd',
      payment_method_types: ["card"]
    })
    res.send({clientSecret : paymentIntent.client_secret})
})


  app.post('/payments',async(req,res)=>{
    const payment = req.body
    const value = await Payment.insertOne(payment)
    res.send(value)
  })

  app.get('/checkUser/:email',async(req,res)=>{
     const email = req.params.email
     let value = false
     const find = await Payment.findOne({email : email})
     if(find){
      value = true
     }
     res.send({value})
  })

  app.get('/givingAcess/:email',async(req,res)=>{
    const email = req.params.email
    let value = false
    const find = await AllItem.find({Owner_email: email}).toArray()
    const findPayment = await Payment.findOne({email : email})
    if(find.length == 0 || findPayment){
      value = true
    }
    res.send({value})
  })


  // update product data
 app.patch('/productsData/:productId',async(req,res)=>{
  console.log(req.body)
  const product = req.body
  const query = {
    Product_id :
    parseInt(req.params.productId)}
  
    const updateDoc = {
      $set:{
        Product_image : product.Product_image ,
        ownerName: product.ownerName,
        Owner_email : product.Owner_email,
        Product_name: product.Product_name,
        Tags : product.Tags,
        External_Links : product.External_Links,
        Description : product.Description     
      }
    }
    const result = await AllItem.updateOne(query,updateDoc)
  res.send(result)
 })

  app.get('/gettingOwnProduct/:email',async(req,res)=>{
    const email  = req.params.email
//     const Upvote = client.db("Tech_Raddar").collection("Upvote");
// const Downvote = client.db("Tech_Raddar").collection("Downvote");
    const agg = await AllItem.aggregate([
      {
        $match: {
          Owner_email: email,
        },
      },
      {
        $lookup: {
          from: 'Downvote',
          let: { localProductId: '$Product_id', localOwnerEmail: '$Owner_email' },
          pipeline:[
            { 
              $match: {
                $expr: {
                  $and : [
                    {$eq : [{$toInt : '$productId'},'$$localProductId']},
                    {$eq : ['$Owner_email','$$localOwnerEmail']}
                  ]
                }
              }
            }
          ],
          as: 'totalDown',
        },
      },
      {
        $lookup: {
          from: 'Upvote',
          let: { localProductId: '$Product_id', localOwnerEmail: '$Owner_email' },
          pipeline:[
            { 
              $match: {
                $expr: {
                  $and : [
                    {$eq : [{$toInt : '$productId'},'$$localProductId']},
                    {$eq : ['$Owner_email','$$localOwnerEmail']}
                  ]
                }
              }
            }
          ],
          as: 'totalUp',
        },
      },
    ]).toArray()
    res.send(agg)

  })

  app.delete('/deleteProduct/:productId',async(req,res)=>{
    const query = {productId : req.params.productId}
    console.log(req.params.productId)
    const quy = { Product_id : parseInt(req.params.productId)}
    const upvote = await Upvote.deleteMany(query)
    const DownVote = await Downvote.deleteMany(query)
    const Product = await AllItem.deleteOne(quy)
    const reported = await Reported.deleteMany(query)
    res.send({upvote,DownVote,Product,reported})
  })
    


  // Admin Checking
   
  app.get('/adminCheck/:email',async(req,res)=>{
    const email = req.params.email
    let value = false
    const query = {email : email }
    const find = await User.findOne(query)
    if(find){
      value = find.role == 'Admin'
    }
    res.send(value)
  })

  app.get('/moderatorCheck/:email',async(req,res)=>{
    const email = req.params.email
    let value = false
    const query = {email : email }
    const find = await User.findOne(query)
    if(find){
      value = find.role == 'Moderator'
    }
    res.send(value)
  })

  app.get('/AllUser',async(req,res)=>{
    const result = await User.find().toArray()
    res.send(result)
  })


  app.get('/reportedProducts',async(req,res)=>{
    const result  = await Reported.find().toArray()
    res.send(result)
  })

  app.delete('/deleteReported/:productId',async(req,res)=>{
     const productId = req.params.productId
     const query = {productId : productId}
     const querytwo = { Product_id : parseInt(productId)}
     const result = await Reported.deleteMany(query)
     const resultSecond = await AllItem.deleteOne(querytwo)
     res.send({result,resultSecond})
  })
 
  app.delete('/ignoreReport/:productId',async(req,res)=>{
    const productId = req.params.productId
    const query = {productId: productId}
    const result = await Reported.deleteOne(query)
    res.send(result)
  })

  app.get('/productQuequ',async(req,res)=>{
    const result = await AllItem.aggregate([
      {
        $sort : {
          Status : -1
        }
      }
    ]).toArray()
    res.send(result)
  })

  app.put('/makeFeature/:productId',async(req,res)=>{
    const productId = req.params.productId
    const query = {Product_id : parseInt(productId)}
    console.log(query)
    const updateDoc = {
      $set : {
        Featured : true
      }
    }
    const result = await AllItem.updateOne(query,updateDoc)
    res.send(result)
  })

  app.put('/RemoveFeature/:productId',async(req,res)=>{
    const productId = req.params.productId
    const query = {Product_id : parseInt(productId)}
    console.log(query)
    const updateDoc = {
      $set : {
        Featured : false
      }
    }
    const result = await AllItem.updateOne(query,updateDoc)
    res.send(result)
  })

  app.put('/acceptedProduct/:productid',async(req,res)=>{
    const productId = req.params.productid
    const query = { Product_id : parseInt(productId)}
    const updateDoc = {
      $set:{
        Status : 'Accepted'
      }
    }
    const result = await AllItem.updateOne(query,updateDoc)
    res.send(result)
  })
  app.put('/RejectProduct/:productid',async(req,res)=>{
    const productId = req.params.productid
    const query = { Product_id : parseInt(productId)}
    const updateDoc = {
      $set:{
        Status : 'Rejected'
      }
    }
    const result = await AllItem.updateOne(query,updateDoc)
    res.send(result)
  })


  // manage User
 
  app.get('/users',async(req,res)=>{
    const result = await User.find().toArray()
    res.send(result)
  })

  // make admin make moderator
  app.put('/makeAdmin/:email',async(req,res)=>{
    const email = req.params.email
    const query = {email : email}
    const updateDoc = {
      $set:{
        role : 'Admin'
      }
    }
    const result = await User.updateOne(query,updateDoc)
    res.send(result)
  })


  app.put('/makeModerator/:email',async(req,res)=>{
    const email = req.params.email
    const query = {email : email}
    const updateDoc = {
      $set:{
        role : 'Moderator'
      }
    }
    const result = await User.updateOne(query,updateDoc)
    res.send(result)
  })

  app.delete('/deleteUser/:email',async(req,res)=>{
    const email = req.params.email
    const query = {email:email}
    const result = await User.deleteOne(query)
    res.send(result)
  })

  app.get('/statsProduct',async(req,res)=>{
    const result = await AllItem.aggregate([
        {
          $group: {
            _id: '$Status',
           count : {$sum : 1}
          }
        }
    ]).toArray()

    const contributor = await AllItem.aggregate([
      {
        $group : {
          _id : '$Owner_email',
          count: {$sum : 1}
        }
      },
      {
        $project : {
          _id : 0,
          email : '$_id',
          count:1
        }
      }
    ]).toArray()
 const Reviews = await ReViewed.estimatedDocumentCount()
 const Report =await Reported.estimatedDocumentCount()
 const resultThird = await Upvote.estimatedDocumentCount()
 const resultfourth = await Downvote.estimatedDocumentCount()
 const usersdata = await User.estimatedDocumentCount()

    const countdata = {
      Accepted : 0,
      Pending: 0,
      Rejected: 0,
      
    }
    const totalVote = {
      Upvote : resultThird,
      DownVote : resultfourth
    }
    const feedback = {
      Reported :Report,
      Reviews:Reviews
    }
    const users = {
      user : usersdata
    }
    

    result.forEach((sta)=>{
      if(sta._id == 'Accepted'){
        countdata.Accepted = sta.count
      }
      else if (sta._id =='Pending'){
        countdata.Pending = sta.count
      }
      else if(sta._id == 'Rejected'){
        countdata.Rejected = sta.count
      }
    })
    res.send({countdata,totalVote,feedback ,users , contributor})
  })

  app.get('/Coupons', async(req,res)=>{
    const result = await Coupon.find().toArray()
    res.send(result)
  })


  app.get('/Coupon/:id',async(req,res)=>{
    const couponId = req.params.id
    const query = {couponId : couponId}
    const result = await Coupon.findOne(query)
    res.send(result)
  })
  app.post('/Coupons',async(req,res)=>{
    const body = req.body
    const result = await Coupon.insertOne(body)
    res.send(result)
  })

  app.get('/verifyCoupon/:couponCode',async(req,res)=>{
    const couponCode = req.params.couponCode
    const query = { couponCode : couponCode}
    const result = await Coupon.findOne(query)
    let amountPercent = 0
   if(result){
    amountPercent = result.discount
   }
    res.send({discount : amountPercent})
  })
  
    
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
