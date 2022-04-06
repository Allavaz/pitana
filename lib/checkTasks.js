require("dotenv").config();
const autoUnban = require("./autoUnban");
const { DateTime } = require("luxon");
const clientPromise = require("./mongodb");

const postponeDuration = { minutes: 10 };

module.exports = async dsClient => {
	try {
		const client = await clientPromise;
		const db = client.db();
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
