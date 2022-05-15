const { MessageEmbed } = require("discord.js");
require("dotenv").config();
const getBanHistory = require("./getBanHistory");
const calculateBanLevel = require("./calculateBanLevel");
const clientPromise = require("./mongodb");

module.exports = async function (interaction, member) {
	const userId = member.id;
	try {
		await interaction.deferReply({ ephemeral: true });
		const client = await clientPromise;
		const db = client.db();
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
			.setDescription(`El ban de ${member.displayName} / ${member} ha sido removido.`)
			.addField("Nivel de ban actual:", banLevel.toString());
		await interaction.editReply("Usuario desbaneado exitosamente.");
		interaction.channel.send({ embeds: [removeBanEmbed] });
	} catch (error) {
		await member.roles.add(process.env.MM_BAN_ROLE_ID);
		throw new Error(error);
	}
};
