import * as dotenv from "dotenv";

if (process.env.ENV === "production") {
	dotenv.config({ path: ".env.prod" });
} else {
	dotenv.config({ path: ".env" });
}

interface Environment {
	token: string;
	mmBanRoleId: string;
	adminRoles: string[];
	dbHostname: string;
	dbUsername: string;
	dbPassword: string;
	dbName: string;
	banLogCollection: string;
	unbanTasksCollection: string;
	banDays: number[];
	guildId: string;
	channelId: string;
	botsChannelId: string;
	arbitrajeChannelId: string;
	resetDays: number[];
	clientId: string;
}

const environment: Environment = {
	token: process.env.TOKEN!.toString(),
	mmBanRoleId: process.env.MM_BAN_ROLE_ID!.toString(),
	adminRoles: JSON.parse(process.env.ADMIN_ROLES!),
	dbHostname: process.env.DB_HOSTNAME!.toString(),
	dbUsername: process.env.DB_USERNAME!.toString(),
	dbPassword: process.env.DB_PASSWORD!.toString(),
	dbName: process.env.DB_NAME!.toString(),
	banLogCollection: process.env.BAN_LOG_COLLECTION!.toString(),
	unbanTasksCollection: process.env.UNBAN_TASKS_COLLECTION!.toString(),
	banDays: JSON.parse(process.env.BAN_DAYS!),
	guildId: process.env.GUILD_ID!.toString(),
	channelId: process.env.CHANNEL_ID!.toString(),
	botsChannelId: process.env.BOTS_CHANNEL_ID!.toString(),
	arbitrajeChannelId: process.env.ARBITRAJE_CHANNEL_ID!.toString(),
	resetDays: JSON.parse(process.env.RESET_DAYS!),
	clientId: process.env.CLIENT_ID!.toString()
};

export default environment;
