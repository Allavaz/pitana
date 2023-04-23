import clientPromise from "./lib/mongodb";
import { DateTime } from "luxon";
import { UnbanTask } from "./types";
import environment from "./environment";

(async () => {
	const date = DateTime.local()
		.setZone("America/Buenos_Aires")
		.startOf("minute");
	try {
		const client = await clientPromise;
		const db = client.db();
		let docs = await db
			.collection(environment.banLogCollection)
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
			.collection(environment.unbanTasksCollection)
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
				.collection(environment.unbanTasksCollection)
				.insertMany(newTasks);
		}
		console.log("You can now CTRL-C");
	} catch (error) {
		console.error(error);
	}
})();
