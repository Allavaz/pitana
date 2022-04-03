const { MessageEmbed } = require("discord.js");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const encuser = encodeURIComponent(process.env.DB_USERNAME);
const encpw = encodeURIComponent(process.env.DB_PASSWORD);
const url = `mongodb://${encuser}:${encpw}@${process.env.DB_HOSTNAME}:27017/?authMecanism=DEFAULT`;
const getBanHistory = require("./getBanHistory");
const calculateBanLevel = require("./calculateBanLevel");

module.exports = async function (interaction, member) {
	const userId = member.id;
	const client = new MongoClient(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	});
	try {
		await interaction.deferReply({ ephemeral: true });
		let mongoclient = await client.connect();
		const db = mongoclient.db(process.env.DB_NAME);
		await db
			.collection("banlog")
			.findOneAndDelete({ playerid: userId }, { sort: { startdate: -1 } });
		await db.collection("unbantasks").findOneAndDelete({ playerid: userId });
		const banHistory = getBanHistory(userId);
		const banLevel = calculateBanLevel(banHistory);
		await member.roles.remove(process.env.MM_BAN_ROLE_ID);
		const removeBanEmbed = new MessageEmbed()
			.setTitle("Ban removido")
			.setColor("GREEN")
			.setThumbnail(member.displayAvatarURL())
			.setDescription(`El ban de ${member} ha sido removido.`)
			.addField("Nivel de ban actual:", banLevel.toString());
		await interaction.editReply("Usuario desbaneado exitosamente.");
		interaction.channel.send({ embeds: [removeBanEmbed] });
	} catch (error) {
		await member.roles.add(process.env.MM_BAN_ROLE_ID);
		throw new Error(error);
	}
};
