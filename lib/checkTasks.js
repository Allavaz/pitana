const config = require("../config.json");
const { MongoClient } = require("mongodb");
const encuser = encodeURIComponent(config.dbusername);
const encpw = encodeURIComponent(config.dbpassword);
const url = `mongodb://${encuser}:${encpw}@${config.dbhostname}:27017/?authMecanism=DEFAULT`;
const autoUnban = require("./autoUnban");
const { DateTime } = require("luxon");

const postponeDuration = { minutes: 10 };

module.exports = async dsClient => {
	const client = new MongoClient(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	});

	try {
		const mongoClient = await client.connect();
		const db = mongoClient.db(config.dbname);
		const tasks = await db.collection("unbantasks").find({}).toArray();
		tasks.forEach(v => {
			const date = DateTime.fromISO(v.date);
			const now = DateTime.local()
				.setZone("America/Buenos_Aires")
				.startOf("minute");
			if (date <= now) {
				autoUnban(v, dsClient)
					.then(() => {
						db.collection("unbantasks").deleteOne(v);
					})
					.catch(error => {
						console.error(error);
						newDate = date.plus(postponeDuration).toISO();
						db.collection("unbantasks").updateOne(
							{ playerid: v.playerid },
							{ $set: { date: newDate } }
						);
					});
			}
		});
	} catch (error) {
		console.error(error);
	}
};
