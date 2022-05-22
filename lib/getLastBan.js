const clientPromise = require("./mongodb");

module.exports = async userId => {
	try {
		const client = await clientPromise;
		const db = client.db();
		const lastBan = await db
			.collection("banlog")
			.findOne({ playerid: userId }, { sort: { startdate: -1 } });
		return lastBan;
	} catch (error) {
		console.error(error);
		throw new Error(error);
	}
};
