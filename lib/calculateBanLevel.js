require("dotenv").config();
const { DateTime } = require("luxon");

module.exports = lastBan => {
	if (!lastBan) return 0;
	const resetDate = DateTime.fromISO(lastBan.enddate).plus({
		days: JSON.parse(process.env.RESET_DAYS)[lastBan.banlevel]
	});
	const now = DateTime.now();
	if (now > resetDate) {
		return 0;
	} else {
		return lastBan.banlevel;
	}
};
