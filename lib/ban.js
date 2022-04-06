require("dotenv").config();
const { MessageEmbed } = require("discord.js");
const { DateTime } = require("luxon");
const calculateBanLevel = require("./calculateBanLevel");
const calculateTime = require("./calculateTime");
const clientPromise = require("./mongodb");

const dateFormat = "dd'/'LL'/'yyyy HH':'mm";

module.exports = async function (interaction, member, reason, customTime) {
	const date = DateTime.local()
		.setZone("America/Buenos_Aires")
		.startOf("minute");
	const userId = member.id;
	try {
		await interaction.deferReply({ ephemeral: true });
		const client = await clientPromise;
		const db = client.db();
		const banHistory = await db
			.collection("banlog")
			.find({ playerid: userId })
			.toArray();
		const banLevel = calculateBanLevel(banHistory) + 1;
		const endDate =
			customTime === "perma" || banLevel >= 7
				? null
				: date.plus(
						customTime
							? customTime
							: { days: JSON.parse(process.env.BAN_DAYS)[banLevel] }
				  );
		let endDateISO = null;
		let endDateString = null;
		if (endDate) {
			endDateISO = endDate.toISO();
			endDateString = endDate.toFormat(dateFormat);
		}
		await db.collection("banlog").insertOne({
			playerid: userId,
			startdate: date.toISO(),
			enddate: endDateISO,
			reason: reason
		});
		await member.roles.add(process.env.MM_BAN_ROLE_ID, reason);
		if (banLevel < 7 && customTime !== "perma") {
			await db.collection("unbantasks").insertOne({
				playerid: userId,
				date: endDateISO
			});
		}
		const banEmbed = new MessageEmbed()
			.setTitle(
				customTime
					? `Usuario baneado ${
							customTime === "perma"
								? "**indefinidamente**"
								: `por ${calculateTime(customTime)}`
					  }`
					: `Usuario baneado ${
							banLevel < 7
								? `por ${JSON.parse(process.env.BAN_DAYS)[banLevel]} día${
										banLevel > 2 ? "s" : ""
								  }`
								: "indefinidamente"
					  }.`
			)
			.setColor("RED")
			.setThumbnail(member.user.displayAvatarURL())
			.addField("Nombre:", `${member}`)
			.addField("Fecha de inicio:", date.toFormat(dateFormat))
			.addField("Fecha de expiración:", endDate ? endDateString : "Indefinido")
			.addField("Motivo de ban:", reason)
			.addField("Nivel de ban actual:", banLevel.toString());
		if (banLevel < 7 && customTime !== "perma") {
			const banResetDate = endDate
				.plus({ days: JSON.parse(process.env.RESET_DAYS)[banLevel] })
				.toFormat(dateFormat);
			banEmbed.addField("Fecha de reseteo de nivel de ban:", banResetDate);
		}
		await interaction.editReply("Usuario baneado exitosamente.");
		await interaction.channel.send({ embeds: [banEmbed] });
	} catch (error) {
		console.error(error);
		await member.roles.remove(process.env.MM_BAN_ROLE_ID, "rollback");
		const client = await clientPromise;
		const db = client.db();
		await db
			.collection("banlog")
			.findOneAndDelete({ playerid: userId, startdate: date.toISO() });
		await db.collection("unbantasks").findOneAndDelete({ playerid: userId });
		throw new Error(error);
	}
};
