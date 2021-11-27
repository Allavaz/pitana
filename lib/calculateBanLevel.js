const config = require("../config.json");
const { DateTime, Interval } = require("luxon");

module.exports = banHistory => {
	if (!banHistory.length) return 0;
	let level = 1;
	let lastDate = DateTime.fromISO(banHistory[0].startdate);
	for (let i = 1; i < banHistory.length; i++) {
		let startDate = DateTime.fromISO(banHistory[i].startdate);
		let interval = Interval.fromDateTimes(lastDate, startDate)
			.toDuration(["days"])
			.toObject();
		if (interval.days < config.banreset[level]) {
			level++;
		} else {
			level = 1;
		}
		lastDate = startDate;
	}
	const lastInterval = Interval.fromDateTimes(lastDate, DateTime.local())
		.toDuration(["days"])
		.toObject();
	if (lastInterval.days > config.banreset[level]) {
		if (banHistory[banHistory.length - 1].enddate === null) {
			level = 1;
		} else {
			level = 0;
		}
	}
	return level;
};
