import environment from "../environment";
import { BanLogItem } from "../types";
import { DateTime } from "luxon";

export default function calculateBanLevel(lastBan: BanLogItem) {
	if (!lastBan) return 0;
	if (lastBan && !lastBan.enddate) return 7;
	const resetDate = DateTime.fromISO(lastBan.enddate).plus({
		days: environment.resetDays[lastBan.banlevel]
	});
	const now = DateTime.now();
	if (now > resetDate) {
		return 0;
	} else {
		return lastBan.banlevel;
	}
}
