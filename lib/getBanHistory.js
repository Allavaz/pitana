require("dotenv").config();
const clientPromise = require("./mongodb");

module.exports = async userId => {
	try {
		const client = await clientPromise;
		const db = client.db();
		const banHistory = await db
			.collection("banlog")
			.find({ playerid: userId })
			.toArray();
		return banHistory;
	} catch (error) {
		console.error(error);
		throw new Error(error);
	}
};
