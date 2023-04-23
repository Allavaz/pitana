import autoUnban from "./autoUnban";
import { DateTime } from "luxon";
import clientPromise from "./mongodb";
import { Client } from "discord.js";
import { UnbanTask } from "../types";
import environment from "../environment";

export default async function checkTasks(dsClient: Client): Promise<void> {
	try {
		const client = await clientPromise;
		const db = client.db();
		const tasks = (await db
			.collection(environment.unbanTasksCollection)
			.find({})
			.toArray()) as UnbanTask[];
		tasks.forEach(v => {
			const date = DateTime.fromISO(v.date);
			const now = DateTime.local().startOf("minute");
			if (date <= now) {
				autoUnban(v, dsClient).then(() =>
					db.collection(environment.unbanTasksCollection).deleteOne(v)
				);
			}
		});
	} catch (error) {
		console.error(error);
	}
}
