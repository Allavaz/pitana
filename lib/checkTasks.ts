import autoUnban from "./autoUnban";
import { DateTime } from "luxon";
import clientPromise from "./mongodb";
import { Client } from "discord.js";
import { UnbanTask } from "../types";

const postponeDuration = { minutes: 10 };

export default async function checkTasks(dsClient: Client): Promise<void> {
	try {
		const client = await clientPromise;
		const db = client.db();
		const tasks = (await db
			.collection("unbantasks")
			.find({})
			.toArray()) as UnbanTask[];
		tasks.forEach(v => {
			const date = DateTime.fromISO(v.date);
			const now = DateTime.local().startOf("minute");
			if (date <= now) {
				autoUnban(v, dsClient)
					.then(() => {
						db.collection("unbantasks").deleteOne(v);
					})
					.catch((error: any) => {
						console.error(error);
						const newDate = date.plus(postponeDuration).toISO();
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
}
