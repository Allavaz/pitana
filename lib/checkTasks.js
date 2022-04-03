require("dotenv").config();
const { MongoClient } = require("mongodb");
const encuser = encodeURIComponent(process.env.DB_USERNAME);
const encpw = encodeURIComponent(process.env.DB_PASSWORD);
const url = `mongodb+srv://${encuser}:${encpw}@${process.env.DB_HOSTNAME}/?authMecanism=DEFAULT`;
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
		const db = mongoClient.db(process.env.DB_NAME);
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
