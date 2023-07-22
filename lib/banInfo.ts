import environment from "../environment";
import {
	ChatInputCommandInteraction,
	GuildMember,
	EmbedBuilder
} from "discord.js";
import { DateTime, Interval, Duration, DateInput } from "luxon";
import calculateBanLevel from "./calculateBanLevel";
import { BanLogItem } from "../types";
import getLastBan from "./getLastBan";

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
	const now = DateTime.local();
	const start = DateTime.fromISO(lastBan.startdate);
	const end = lastBan.enddate ? DateTime.fromISO(lastBan.enddate) : null;
	const initialDuration = end ? durationAutoUnits(start, end) : null;
	const remainingDuration = end ? durationAutoUnits(now, end) : null;
	const banLevel = calculateBanLevel(lastBan);
	const resetDate = end
		? DateTime.fromISO(lastBan.enddate).plus({
				days: environment.resetDays[banLevel]
		  })
		: null;
	const remainingReset = resetDate ? durationAutoUnits(now, resetDate) : null;
	const toHumanOpts = { maximumFractionDigits: 0 };
	return {
		isBanned: end === null || now <= end,
		startDate: start.toFormat(dateFormat),
		endDate: end ? end.toFormat(dateFormat) : null,
		initialDuration: initialDuration
			? Duration.fromObject(initialDuration).toHuman(toHumanOpts)
			: null,
		remainingDuration: remainingDuration
			? Duration.fromObject(remainingDuration).toHuman(toHumanOpts)
			: null,
		banLevel: banLevel,
		resetDate: resetDate ? resetDate.toFormat(dateFormat) : null,
		remainingReset: remainingReset
			? Duration.fromObject(remainingReset).toHuman(toHumanOpts)
			: null
	};
};

export default async function banInfo(
	interaction: ChatInputCommandInteraction,
	member: GuildMember
) {
	const userId = member.id;
	try {
		await interaction.deferReply({ ephemeral: true });
		const banInfoEmbed = new EmbedBuilder()
			.setTitle("Información de ban")
			.setColor("Blue")
			.setThumbnail(member.user.displayAvatarURL());
		const lastBan = await getLastBan(userId);
		if (!lastBan) {
			banInfoEmbed.setDescription(
				`${member.displayName} **no** se encuentra baneado del matchmaking.`
			);
			banInfoEmbed.addFields({
				name: "Nivel de ban actual:",
				value: "0"
			});
			return await interaction.editReply({ embeds: [banInfoEmbed] });
		}
		const userInfo = getInfoFromLastBan(lastBan);
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
