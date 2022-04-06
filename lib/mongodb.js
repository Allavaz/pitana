require("dotenv").config();
const { MongoClient } = require("mongodb");

const encuser = encodeURIComponent(process.env.DB_USERNAME);
const encpw = encodeURIComponent(process.env.DB_PASSWORD);
const uri = `mongodb+srv://${encuser}:${encpw}@${process.env.DB_HOSTNAME}/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const options = { useUnifiedTopology: true };

let client;
let clientPromise;

client = new MongoClient(uri, options);
clientPromise = client.connect();

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
module.exports = clientPromise;
