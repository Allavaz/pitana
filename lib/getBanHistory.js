require("dotenv").config();
const { MongoClient } = require("mongodb");
const encuser = encodeURIComponent(process.env.DB_USERNAME);
const encpw = encodeURIComponent(process.env.DB_PASSWORD);
const url = `mongodb+srv://${encuser}:${encpw}@${process.env.DB_HOSTNAME}/?authMecanism=DEFAULT`;

module.exports = async userId => {
	const client = new MongoClient(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	});

	try {
		const mongoClient = await client.connect();
		const db = mongoClient.db(process.env.DB_NAME);
		const banHistory = await db
			.collection("banlog")
			.find({ playerid: userId })
			.toArray();
		return banHistory;
	} catch (error) {
		console.error(error);
		throw new Error(error);
	}
};
