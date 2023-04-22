import clientPromise from "./lib/mongodb";
import { DateTime } from "luxon";
import { UnbanTask } from "./types";

(async () => {
	const date = DateTime.local()
		.setZone("America/Buenos_Aires")
		.startOf("minute");
	try {
		const client = await clientPromise;
		const db = client.db();
		let docs = await db
			.collection(process.env.BAN_LOG_COLLECTION as string)
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
		let oldTasks = await db
			.collection(process.env.UNBAN_TASKS_COLLECTION as string)
			.find({})
			.toArray();
		let newTasks: UnbanTask[] = [];
		let docsFiltered = docs.filter(e => DateTime.fromISO(e.enddate) >= date);
		docsFiltered.forEach(e => {
			if (!oldTasks.find(e2 => e2.playerid === e._id)) {
				newTasks.push({
					playerid: e._id,
					date: e.enddate
				});
			}
		});
		console.log(newTasks);
		if (newTasks.length) {
			await db
				.collection(process.env.UNBAN_TASKS_COLLECTION as string)
				.insertMany(newTasks);
		}
		console.log("You can now CTRL-C");
	} catch (error) {
		console.error(error);
	}
})();
