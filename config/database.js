const { MongoClient } = require('mongodb');
const uri = 'mongodb://localhost:27017/';

let db;

module.exports.connectDB = async () => {
  // use cached db connection instead of creating new one every time
  if (db) {
    // console.log("Using cached db connection!");
    return db;
  }

  const client = new MongoClient(uri, { minPoolSize: 2, maxPoolSize: 12, maxIdleTimeMS: 60000 });

  try {
    // Connect to MongoDB
    await client.connect();
    await client.db("rippleink_db").command({ ping: 1 });  // ping db to check if it's responsive
    db = client.db("rippleink_db");
    console.log("Connected to MongoDB!");
    return db;
  } catch (error) {
    // Log error if connection fails
    console.error(error);
    // process.exit(1);
  }
};
