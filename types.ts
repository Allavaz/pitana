import { ObjectId } from "mongodb";

export type UnbanTask = {
	_id?: ObjectId;
	playerid: string;
	date: string;
};

export type BanLogItem = {
	_id: ObjectId;
	playerid: string;
	startdate: string;
	enddate: string;
	reason: string;
	banlevel: number;
	bannedby?: string;
};

export type CustomTime =
	| { days: number }
	| { hours: number }
	| { minutes: number }
	| "perma"
	| "doble";
