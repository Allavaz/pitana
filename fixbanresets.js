const config = require("./config.json");
const { MongoClient } = require("mongodb");
const encuser = encodeURIComponent(config.dbusername);
const encpw = encodeURIComponent(config.dbpassword);
const url = `mongodb://${encuser}:${encpw}@${config.dbhostname}:27017/?authMecanism=DEFAULT`;
const { DateTime } = require("luxon");

async function fixBanResets() {
	const client = new MongoClient(url, { useNewUrlParser: true });
	const now = DateTime.local().toISO();
	try {
		let mongoclient = await client.connect();
		const db = mongoclient.db(config.dbname);
		let items = await db
			.collection("banlist")
			.find({ count: { $gt: 0 } })
			.toArray();
		let tofix = [];
		for (let i = 0; i < items.length; i++) {
			if (
				DateTime.fromISO(items[i].lastban)
					.plus({ days: config.banreset[items[i].count] })
					.toISO() < now
			) {
				tofix.push(items[i]._id);
			}
		}
		let res = await db
			.collection("banlist")
			.updateMany({ _id: { $in: tofix } }, { $set: { count: 0 } });
		console.log(`Modified ${res.modifiedCount} documents.`);
		process.exit();
	} catch (e) {
		console.error(e);
		process.exit();
	}
}

fixBanResets();
