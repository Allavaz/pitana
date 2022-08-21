require("dotenv").config();
const { MessageEmbed } = require("discord.js");
const { DateTime, Interval, Duration } = require("luxon");
const calculateBanLevel = require("./calculateBanLevel");
const clientPromise = require("./mongodb");

const dateFormat = "dd'/'LL'/'yyyy HH':'mm";

const durationAutoUnits = (start, end) => {
	const interval = Interval.fromDateTimes(start, end)
		.toDuration(["years", "months", "days", "hours", "minutes"])
		.toObject();
	return removeZero(interval);
};

const removeZero = item =>
	Object.keys(item)
		.filter(key => item[key] !== 0)
		.reduce((newObj, key) => Object.assign(newObj, { [key]: item[key] }), {});

const getInfoFromLastBan = lastBan => {
	if (!lastBan)
		return {
			isBanned: false,
			banLevel: "0"
		};
	const now = DateTime.local();
	const start = DateTime.fromISO(lastBan.startdate);
	const end = lastBan.enddate ? DateTime.fromISO(lastBan.enddate) : null;
	const initialDuration = lastBan.enddate
		? durationAutoUnits(start, end)
		: null;
	const remainingDuration = lastBan.enddate
		? durationAutoUnits(now, end)
		: null;
	const banLevel = calculateBanLevel(lastBan);
	const resetDate = DateTime.fromISO(lastBan.enddate).plus({
		days: JSON.parse(process.env.RESET_DAYS)[banLevel]
	});
	const remainingReset = durationAutoUnits(now, resetDate);
	const toHumanOpts = { maximumFractionDigits: 0 };
	return {
		isBanned: now <= end || end === null,
		startDate: start.toFormat(dateFormat),
		endDate: end ? end.toFormat(dateFormat) : null,
		initialDuration: end
			? Duration.fromObject(initialDuration).toHuman(toHumanOpts)
			: null,
		remainingDuration: end
			? Duration.fromObject(remainingDuration).toHuman(toHumanOpts)
			: null,
		banLevel: banLevel.toString(),
		resetDate: resetDate.toFormat(dateFormat),
		remainingReset: Duration.fromObject(remainingReset).toHuman(toHumanOpts)
	};
};

module.exports = async function (interaction, member) {
	const userId = member.id;
	try {
		await interaction.deferReply({ ephemeral: true });
		const client = await clientPromise;
		const db = client.db();
		const lastBan = await db
			.collection("banlog")
			.findOne({ playerid: userId }, { sort: { startdate: -1 } });
		const userInfo = getInfoFromLastBan(lastBan);
		const banInfoEmbed = new MessageEmbed()
			.setTitle("Información de ban")
			.setColor("BLUE")
			.setThumbnail(member.user.displayAvatarURL());
		if (userInfo.isBanned) {
			banInfoEmbed
				.addField("Motivo:", lastBan.reason)
				.addField("Fecha de inicio:", userInfo.startDate);
			if (userInfo.endDate) {
				banInfoEmbed
					.setDescription(
						`${member.displayName} se encuentra **baneado** por **${userInfo.initialDuration}** del matchmaking.`
					)
					.addField("Fecha de expiración:", userInfo.endDate)
					.addField("Tiempo restante del ban:", userInfo.remainingDuration);
			} else {
				banInfoEmbed.setDescription(
					`${member.displayName} se encuentra **baneado indefinidamente** del matchmaking.`
				);
			}
			if (
				interaction.channelId === process.env.ARBITRAJE_CHANNEL_ID &&
				lastBan.bannedby
			) {
				const bannedBy = await interaction.guild.members.fetch(
					lastBan.bannedby
				);
				banInfoEmbed.addField(
					"Baneado por",
					`${bannedBy.displayName} / ${bannedBy}`
				);
			}
		} else {
			banInfoEmbed.setDescription(
				`${member.displayName} **no** se encuentra baneado del matchmaking.`
			);
		}
		banInfoEmbed.addField("Nivel de ban actual:", userInfo.banLevel);
		if (userInfo.banLevel > 0) {
			banInfoEmbed.addField(
				"Tiempo restante para el reseteo de nivel de ban:",
				userInfo.remainingReset
			);
		}
		await interaction.editReply({ embeds: [banInfoEmbed] });
	} catch (error) {
		console.error(error);
		throw new Error(error);
	}
};
