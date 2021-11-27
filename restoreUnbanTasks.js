const config = require("./config.json");
const { MongoClient } = require("mongodb");
const { DateTime } = require("luxon");
const encuser = encodeURIComponent(config.dbusername);
const encpw = encodeURIComponent(config.dbpassword);
const url = `mongodb://${encuser}:${encpw}@${config.dbhostname}:27017/?authMecanism=DEFAULT`;

(async () => {
	const date = DateTime.local()
		.setZone("America/Buenos_Aires")
		.startOf("minute");
	const client = new MongoClient(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	});
	try {
		const mongoClient = await client.connect();
		const db = mongoClient.db(config.dbname);
		let docs = await db
			.collection("banlog")
			.aggregate([
				{
					$group: {
						_id: "$playerid",
						startdate: {
							$last: "$startdate"
						},
						enddate: {
							$last: "$enddate"
						},
						reason: {
							$last: "$reason"
						}
					}
				},
				{
					$sort: {
						startdate: -1
					}
				}
			])
			.toArray();
		let oldTasks = await db.collection("unbantasks").find({}).toArray();
		newTasks = [];
		docsFiltered = docs.filter(e => DateTime.fromISO(e.enddate) >= date);
		docsFiltered.forEach(e => {
			if (!oldTasks.find(e2 => e2.playerid === e._id)) {
				newTasks.push({
					playerid: e._id,
					startdate: e.startdate,
					enddate: e.enddate,
					reason: e.reason
				});
			}
		});
		console.log(newTasks);
		if (newTasks.length) {
			await db.collection("unbantasks").insertMany(newTasks);
		}
	} catch (error) {
		console.error(error);
	}
})();
