require("dotenv").config();
const { MessageEmbed } = require("discord.js");
const { DateTime, Interval } = require("luxon");
const calculateTime = require("./calculateTime");
const calculateBanLevel = require("./calculateBanLevel");
const clientPromise = require("./mongodb");

const dateFormat = "dd'/'LL'/'yyyy HH':'mm";

const getInfoFromHistory = banHistory => {
	if (!banHistory.length)
		return {
			isBanned: false,
			banLevel: "0"
		};
	const lastBan = banHistory[banHistory.length - 1];
	const now = DateTime.local();
	const start = DateTime.fromISO(lastBan.startdate);
	const end = lastBan.enddate ? DateTime.fromISO(lastBan.enddate) : null;
	const initialDuration = lastBan.enddate
		? Interval.fromDateTimes(start, end)
				.toDuration(["days", "hours", "minutes"])
				.toObject()
		: null;
	const remainingDuration = lastBan.enddate
		? Interval.fromDateTimes(now, end)
				.toDuration(["days", "hours", "minutes"])
				.toObject()
		: null;
	const banLevel = calculateBanLevel(banHistory);
	const resetDate = DateTime.fromISO(lastBan.enddate).plus({
		days: JSON.parse(process.env.RESET_DAYS)[banLevel]
	});
	const remainingReset = Interval.fromDateTimes(now, resetDate)
		.toDuration(["days", "hours", "minutes"])
		.toObject();

	return {
		isBanned: now <= end || end === null,
		startDate: start.toFormat(dateFormat),
		endDate: end ? end.toFormat(dateFormat) : null,
		initialDuration: end ? calculateTime(initialDuration) : null,
		remainingDuration: end ? calculateTime(remainingDuration) : null,
		banLevel: banLevel.toString(),
		resetDate: resetDate.toFormat(dateFormat),
		remainingReset: calculateTime(remainingReset)
	};
};

module.exports = async function (interaction, member) {
	const userId = member.id;
	try {
		await interaction.deferReply({ ephemeral: true });
		const client = await clientPromise;
		const db = client.db();
		const banHistory = await db
			.collection("banlog")
			.find({ playerid: userId })
			.toArray();
		const userInfo = getInfoFromHistory(banHistory);
		const banInfoEmbed = new MessageEmbed()
			.setTitle("Información de ban")
			.setColor("BLUE")
			.setThumbnail(member.user.displayAvatarURL());
		if (userInfo.isBanned) {
			banInfoEmbed
				.addField("Motivo:", banHistory[banHistory.length - 1].reason)
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
