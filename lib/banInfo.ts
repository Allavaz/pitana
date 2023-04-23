import environment from "../environment";
import {
	ChatInputCommandInteraction,
	GuildMember,
	EmbedBuilder
} from "discord.js";
import { DateTime, Interval, Duration, DateInput } from "luxon";
import calculateBanLevel from "./calculateBanLevel";
import clientPromise from "./mongodb";
import { BanLogItem } from "../types";

const dateFormat = "dd'/'LL'/'yyyy HH':'mm";

const durationAutoUnits = (start: DateInput, end: DateInput) => {
	const interval = Interval.fromDateTimes(start, end)
		.toDuration(["years", "months", "days", "hours", "minutes"])
		.toObject();
	return removeZero(interval);
};

const removeZero = (item: any) =>
	Object.keys(item)
		.filter(key => item[key] !== 0)
		.reduce((newObj, key) => Object.assign(newObj, { [key]: item[key] }), {});

const getInfoFromLastBan = (lastBan: BanLogItem) => {
	if (!lastBan)
		return {
			isBanned: false,
			banLevel: 0
		};
	const now = DateTime.local();
	const start = DateTime.fromISO(lastBan.startdate);
	const end = DateTime.fromISO(lastBan.enddate);
	const initialDuration = lastBan.enddate
		? durationAutoUnits(start, end)
		: null;
	const remainingDuration = lastBan.enddate
		? durationAutoUnits(now, end)
		: null;
	const banLevel = calculateBanLevel(lastBan);
	const resetDate = DateTime.fromISO(lastBan.enddate).plus({
		days: environment.resetDays[banLevel]
	});
	const remainingReset = durationAutoUnits(now, resetDate);
	const toHumanOpts = { maximumFractionDigits: 0 };
	return {
		isBanned: now <= end || end === null,
		startDate: start.toFormat(dateFormat),
		endDate: end ? end.toFormat(dateFormat) : null,
		initialDuration: initialDuration
			? Duration.fromObject(initialDuration).toHuman(toHumanOpts)
			: null,
		remainingDuration: remainingDuration
			? Duration.fromObject(remainingDuration).toHuman(toHumanOpts)
			: null,
		banLevel: banLevel,
		resetDate: resetDate.toFormat(dateFormat),
		remainingReset: Duration.fromObject(remainingReset).toHuman(toHumanOpts)
	};
};

export default async function banInfo(
	interaction: ChatInputCommandInteraction,
	member: GuildMember
) {
	const userId = member.id;
	try {
		await interaction.deferReply({ ephemeral: true });
		const client = await clientPromise;
		const db = client.db();
		const lastBan = (await db
			.collection(environment.banLogCollection)
			.findOne(
				{ playerid: userId },
				{ sort: { startdate: -1 } }
			)) as BanLogItem;
		const userInfo = getInfoFromLastBan(lastBan);
		const banInfoEmbed = new EmbedBuilder()
			.setTitle("Información de ban")
			.setColor("Blue")
			.setThumbnail(member.user.displayAvatarURL());
		if (userInfo.isBanned) {
			banInfoEmbed.addFields({
				name: "Motivo:",
				value: lastBan.reason
			});
			if (userInfo.endDate) {
				banInfoEmbed
					.setDescription(
						`${member.displayName} se encuentra **baneado** por **${userInfo.initialDuration}** del matchmaking.`
					)
					.addFields({ name: "Fecha de expiración:", value: userInfo.endDate });
				if (userInfo.remainingDuration) {
					banInfoEmbed.addFields({
						name: "Tiempo restante del ban:",
						value: userInfo.remainingDuration
					});
				}
			} else {
				banInfoEmbed.setDescription(
					`${member.displayName} se encuentra **baneado indefinidamente** del matchmaking.`
				);
			}
			if (
				interaction.channelId === environment.arbitrajeChannelId &&
				lastBan.bannedby
			) {
				const bannedBy = await interaction.guild!.members.fetch(
					lastBan.bannedby
				);
				banInfoEmbed.addFields({
					name: "Baneado por",
					value: `${bannedBy.displayName} / ${bannedBy}`
				});
			}
		} else {
			banInfoEmbed.setDescription(
				`${member.displayName} **no** se encuentra baneado del matchmaking.`
			);
		}
		banInfoEmbed.addFields({
			name: "Nivel de ban actual:",
			value: userInfo.banLevel.toString()
		});
		if (userInfo.banLevel > 0 && userInfo.remainingReset) {
			banInfoEmbed.addFields({
				name: "Tiempo restante para el reseteo de nivel de ban:",
				value: userInfo.remainingReset
			});
		}
		await interaction.editReply({ embeds: [banInfoEmbed] });
	} catch (error: any) {
		console.error(error);
		throw new Error(error);
	}
}
