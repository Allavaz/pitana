import * as dotenv from "dotenv";
dotenv.config();
import { MongoClient } from "mongodb";

const encuser = encodeURIComponent(process.env.DB_USERNAME as string);
const encpw = encodeURIComponent(process.env.DB_PASSWORD as string);
const uri = `mongodb+srv://${encuser}:${encpw}@${process.env.DB_HOSTNAME}/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri);
const clientPromise = client.connect();

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
