import { MongoClient } from "mongodb";
import environment from "../environment";

const encuser = encodeURIComponent(environment.dbUsername);
const encpw = encodeURIComponent(environment.dbPassword);
const uri = `mongodb+srv://${encuser}:${encpw}@${environment.dbHostname}/${environment.dbName}?retryWrites=true&w=majority`;

const client = new MongoClient(uri);
const clientPromise = client.connect();

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
