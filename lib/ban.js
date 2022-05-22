require("dotenv").config();
const { MessageEmbed } = require("discord.js");
const { DateTime, Duration } = require("luxon");
const calculateBanLevel = require("./calculateBanLevel");
const clientPromise = require("./mongodb");

const dateFormat = "dd'/'LL'/'yyyy HH':'mm";

module.exports = async function (interaction, member, reason, customTime) {
	const date = DateTime.local().startOf("minute");
	const userId = member.id;
	try {
		await interaction.deferReply({ ephemeral: true });
		const client = await clientPromise;
		const db = client.db();
		const lastBan = await db
			.collection("banlog")
			.findOne({ playerid: userId }, { sort: { startdate: -1 } });
		const banLevel =
			calculateBanLevel(lastBan) + (customTime === "doble" ? 2 : 1);
		const endDate =
			customTime === "perma" || banLevel >= 7
				? null
				: date.plus(
						customTime && customTime !== "doble"
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
			reason: reason,
			banlevel: banLevel
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
				customTime && customTime !== "doble"
					? `Usuario baneado ${
							customTime === "perma"
								? "**indefinidamente**"
								: `por ${Duration.fromObject(customTime).toHuman()}`
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
			.addField("Nombre:", `${member.displayName} / ${member}`)
			.addField("Fecha de inicio:", date.toFormat(dateFormat))
			.addField("Fecha de expiración:", endDate ? endDateString : "Indefinido")
			.addField("Motivo de ban:", reason)
			.addField(
				"Nivel de ban actual:",
				banLevel.toString() + (customTime === "doble" ? " (Ban doble)" : "")
			);
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
