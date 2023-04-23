import { GuildMember } from "discord.js";
import clientPromise from "./mongodb";
import { UnbanTask } from "../types";
import environment from "../environment";

export default async function isBanned(member: GuildMember) {
	try {
		const client = await clientPromise;
		const db = client.db();
		const tasks = (await db
			.collection(environment.unbanTasksCollection)
			.find({ playerid: member.id })
			.toArray()) as UnbanTask[];
		return tasks.length > 0;
	} catch (err: any) {
		console.error(err);
		throw new Error(err);
	}
}
