import clientPromise from "./mongodb";
import * as dotenv from "dotenv";
dotenv.config();

export default async function getLastBan(userId: string): Promise<any> {
	try {
		const client = await clientPromise;
		const db = client.db();
		const lastBan = await db
			.collection(process.env.BAN_LOG_COLLECTION as string)
			.findOne({ playerid: userId }, { sort: { startdate: -1 } });
		return lastBan;
	} catch (error: any) {
		console.error(error);
		throw new Error(error);
	}
}
