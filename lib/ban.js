const config = require("../config.json");
const { MessageEmbed } = require("discord.js");
const { MongoClient } = require("mongodb");
const encuser = encodeURIComponent(config.dbusername);
const encpw = encodeURIComponent(config.dbpassword);
const url = `mongodb://${encuser}:${encpw}@${config.dbhostname}:27017/?authMecanism=DEFAULT`;
const { DateTime } = require("luxon");
const calculateBanLevel = require("./calculateBanLevel");
const calculateTime = require("./calculateTime");

const dateFormat = "dd'/'LL'/'yyyy HH':'mm";

module.exports = async function (interaction, user, reason, customTime) {
	const date = DateTime.local()
		.setZone("America/Buenos_Aires")
		.startOf("minute");
	const userId = user.id.toString();
	const member = await interaction.guild.members.cache.get(userId);
	const client = new MongoClient(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	});
	try {
		let mongoclient = await client.connect();
		const db = mongoclient.db(config.dbname);
		const banHistory = await db
			.collection("banlog")
			.find({ playerid: userId })
			.toArray();
		const banLevel = calculateBanLevel(banHistory) + 1;
		const endDate =
			customTime === "perma" || banLevel >= 7
				? null
				: date.plus(
						customTime ? customTime : { days: config.bandays[banLevel] }
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
		await member.roles.add(config.mmbanroleid, reason);
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
								? `por ${config.bandays[banLevel]} día${
										banLevel > 2 ? "s" : ""
								  }`
								: "indefinidamente"
					  }.`
			)
			.setColor("RED")
			.setThumbnail(user.displayAvatarURL())
			.addField("Nombre:", member.displayName)
			.addField("Fecha de inicio:", date.toFormat(dateFormat))
			.addField("Fecha de expiración:", endDate ? endDateString : "Indefinido")
			.addField("Motivo de ban:", reason)
			.addField("Nivel de ban actual:", banLevel.toString());
		if (banLevel < 7 && customTime !== "perma") {
			const banResetDate = DateTime.fromISO(date)
				.plus({ days: config.banreset[banLevel] })
				.toFormat(dateFormat);
			banEmbed.addField("Fecha de reseteo de nivel de ban:", banResetDate);
		}
		interaction.reply({
			content: "Usuario baneado exitosamente.",
			ephemeral: true
		});
		interaction.channel.send({ embeds: [banEmbed] });
	} catch (error) {
		console.error(error);
		await member.roles.remove(config.mmbanroleid, "rollback");
		let mongoclient = await client.connect();
		const db = mongoclient.db(config.dbname);
		await db
			.collection("banlog")
			.findOneAndDelete({ playerid: userId, startdate: date.toISO() });
		await db.collection("unbantasks").findOneAndDelete({ playerid: userId });
		throw new Error(error);
	}
};
