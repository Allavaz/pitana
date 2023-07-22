import environment from "../environment";
import { BanLogItem } from "../types";
import clientPromise from "./mongodb";

export default async function getLastBan(userId: string) {
	try {
		const client = await clientPromise;
		const db = client.db();
		const lastBan = await db
			.collection(environment.banLogCollection)
			.findOne({ playerid: userId }, { sort: { startdate: -1 } });
		if (lastBan) return lastBan as BanLogItem;
		return null;
	} catch (error: any) {
		console.error(error);
		throw new Error(error);
	}
}
