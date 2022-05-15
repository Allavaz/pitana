require("dotenv").config();
const { DateTime, Interval } = require("luxon");

module.exports = banHistory => {
	if (!banHistory.length) return 0;
	const lastBan = banHistory[banHistory.length - 1];
	if (lastBan.banlevel) {
		const resetDate = DateTime.fromISO(lastBan.enddate).plus({
			days: JSON.parse(process.env.RESET_DAYS)[lastBan.banlevel]
		});
		const now = DateTime.now();
		if (now > resetDate) {
			return 0;
		} else {
			return lastBan.banlevel;
		}
	} else {
		let level = 1;
		let lastDate = DateTime.fromISO(banHistory[0].enddate);
		for (let i = 1; i < banHistory.length; i++) {
			let endDate = DateTime.fromISO(banHistory[i].enddate);
			let interval = Interval.fromDateTimes(lastDate, endDate)
				.toDuration(["days"])
				.toObject();
			if (interval.days < JSON.parse(process.env.RESET_DAYS)[level]) {
				level++;
			} else {
				level = 1;
			}
			lastDate = endDate;
		}
		const lastInterval = Interval.fromDateTimes(lastDate, DateTime.local())
			.toDuration(["days"])
			.toObject();
		if (lastInterval.days > JSON.parse(process.env.RESET_DAYS)[level]) {
			if (banHistory[banHistory.length - 1].enddate === null) {
				level = 1;
			} else {
				level = 0;
			}
		}
		return level;
	}
};
