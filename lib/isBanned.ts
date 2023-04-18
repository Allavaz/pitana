import { GuildMember } from "discord.js";
import clientPromise from "./mongodb";
import { UnbanTask } from "../types";

export default async function isBanned(member: GuildMember) {
	try {
		const client = await clientPromise;
		const db = client.db();
		const tasks = (await db
			.collection("unbantasks")
			.find({ playerid: member.id })
			.toArray()) as UnbanTask[];
		return tasks.length > 0;
	} catch (err: any) {
		console.error(err);
		throw new Error(err);
	}
}
