const express = require("express");
const app =express();
const cors = require("cors");
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) =>{
  const authorization = req.headers.authorization;
  if(!authorization){
   return res.status(401).send({Error: true, message: 'unauthorize-token'})
  }
  const token = authorization.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode)=>{
    if(err){
      return res.status(401).send({Error: true, message: 'unauthorize-token'})
    }
    req.decode = decode;
    next();
  })

}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dzmtgtr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const toysDetails = client.db('toysDB').collection('toys');
    const userDetails = client.db('toysDB').collection('user');
    const cartsDetails = client.db('toysDB').collection('carts');
   app.get('/details', async(req, res) =>{
    const result = await toysDetails.find().toArray();
    console.log(result)
    res.send(result)
   })
   app.get('/details/:id', async(req, res)=>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    console.log(id)
    const detailsCar =await toysDetails.findOne(query)
    res.send(detailsCar)
})
// JWT

app.post('/jwt', (req, res)=>{
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' } )
  res.send({token})
})
// users collection

  app.get('/dashBoard/user', async(req, res)=>{
    const result = await userDetails.find().toArray();
    res.send(result)
  })
  app.post('/dashBoard/user', async(req, res)=>{
    const user = req.body;
    const query ={email:user.email};
    const existingUser = await userDetails.findOne(query)
    if(existingUser){
      return res.send({message:"user already exist"})
    }
    const result = await userDetails.insertOne(user)
     res.send(result)
  })
  app.patch('/dashBoard/user/admin/:id', async (req, res)=>{
    const id = req.params.id;
    const filter = { _id: new ObjectId(id)};
    console.log(id)
    const updateDoc = {
      $set: {
        role: 'admin'
      },
    };
    const result = await userDetails.updateOne(filter, updateDoc);
    res.send(result)

  })
  app.delete('/dashBoard/user/:id', async (req, res) =>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    console.log(id)
    const result = await userDetails.deleteOne(query);
    res.send(result);
  })

  // cart collection
  app.get('/dashBoard/carts', verifyJWT, async(req, res) =>{
    const email =req.query.email;
    console.log(email)
    if(!email){
      return res.send([])
    }

    const decodedEmail = req.decode.email;
    if(email !== decodedEmail){
      return res.status(403).send({error:true, message:'forbidden access'})
    }
    const query = {email: email}
    const result= await cartsDetails.find(query).toArray();
    res.send(result)
  })
  app.post('/dashBoard/carts', async (req, res)=>{
    const item = req.body;
    console.log(item);
    const result = await cartsDetails.insertOne(item)
    res.send(result)
  })

  app.delete('/dashBoard/carts/:id', async (req, res) =>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)};
    console.log(id)
    const result = await cartsDetails.deleteOne(query);
    res.send(result);
  })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) =>{
    res.send('project is running')
})

app.get('/details:id', (req, res) =>{
  res.send()
})

app.listen(port,() =>{
    console.log(`project run in server ${port}`)
})