const config = require("../config.json");
const { MongoClient } = require("mongodb");
const encuser = encodeURIComponent(config.dbusername);
const encpw = encodeURIComponent(config.dbpassword);
const url = `mongodb://${encuser}:${encpw}@${config.dbhostname}:27017/?authMecanism=DEFAULT`;

module.exports = async userId => {
	const client = new MongoClient(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	});

	try {
		const mongoClient = await client.connect();
		const db = mongoClient.db(config.dbname);
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
