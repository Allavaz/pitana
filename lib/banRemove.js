const { MessageEmbed } = require("discord.js");
const config = require("../config");
const { MongoClient } = require("mongodb");
const encuser = encodeURIComponent(config.dbusername);
const encpw = encodeURIComponent(config.dbpassword);
const url = `mongodb://${encuser}:${encpw}@${config.dbhostname}:27017/?authMecanism=DEFAULT`;
const getBanHistory = require("./getBanHistory");
const calculateBanLevel = require("./calculateBanLevel");

module.exports = async function (interaction, user) {
	const userId = user.id.toString();
	const member = await interaction.guild.members.cache.get(userId);
	const client = new MongoClient(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	});
	try {
		let mongoclient = await client.connect();
		const db = mongoclient.db(config.dbname);
		await db
			.collection("banlog")
			.findOneAndDelete({ playerid: userId }, { sort: { startdate: -1 } });
		await db.collection("unbantasks").findOneAndDelete({ playerid: userId });
		const banHistory = getBanHistory(userId);
		const banLevel = calculateBanLevel(banHistory);
		await member.roles.remove(config.mmbanroleid);
		const removeBanEmbed = new MessageEmbed()
			.setTitle("Ban removido")
			.setColor("GREEN")
			.setThumbnail(member.displayAvatarURL())
			.setDescription(`El ban de ${member} ha sido removido.`)
			.addField("Nivel de ban actual:", banLevel.toString());
		interaction.reply({
			content: "Usuario desbaneado exitosamente.",
			ephemeral: true
		});
		interaction.channel.send({ embeds: [removeBanEmbed] });
	} catch (error) {
		await member.roles.add(config.mmbanroleid);
		throw new Error(error);
	}
};
