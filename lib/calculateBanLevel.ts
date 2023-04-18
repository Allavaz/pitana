import * as dotenv from "dotenv";
import { BanLogItem } from "../types";
dotenv.config();
const { DateTime } = require("luxon");

export default function calculateBanLevel(lastBan: BanLogItem) {
	if (!lastBan) return 0;
	if (lastBan && !lastBan.enddate) return 7;
	const resetDate = DateTime.fromISO(lastBan.enddate).plus({
		days: JSON.parse(process.env.RESET_DAYS as string)[lastBan.banlevel]
	});
	const now = DateTime.now();
	if (now > resetDate) {
		return 0;
	} else {
		return lastBan.banlevel;
	}
}
