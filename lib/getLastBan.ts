import environment from "../environment";
import clientPromise from "./mongodb";

export default async function getLastBan(userId: string): Promise<any> {
	try {
		const client = await clientPromise;
		const db = client.db();
		const lastBan = await db
			.collection(environment.banLogCollection)
			.findOne({ playerid: userId }, { sort: { startdate: -1 } });
		return lastBan;
	} catch (error: any) {
		console.error(error);
		throw new Error(error);
	}
}
