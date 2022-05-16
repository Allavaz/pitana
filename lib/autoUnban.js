const { MessageEmbed } = require("discord.js");
require("dotenv").config();
const calculateBanLevel = require("./calculateBanLevel");
const getBanHistory = require("./getBanHistory");

module.exports = async (task, client) => {
	try {
		const banHistory = await getBanHistory(task.playerid);
		const banLevel = calculateBanLevel(banHistory);
		const guild = await client.guilds.fetch(process.env.GUILD_ID);
		const member = await guild.members.fetch(task.playerid);
		const channel = await guild.channels.fetch(process.env.CHANNEL_ID);

		await member.roles.remove(process.env.MM_BAN_ROLE_ID, "Auto Unban");

		const unbanEmbed = new MessageEmbed()
			.setTitle("Usuario desbaneado")
			.setColor("GREEN")
			.setDescription(`El ban de ${member.displayName} / ${member} ha expirado.`)
			.setThumbnail(member.user.displayAvatarURL())
			.addField("Nivel de ban actual:", banLevel.toString());

		await channel.send({ embeds: [unbanEmbed] });
	} catch (error) {
		throw new Error(
			`No se encontró al jugador ${task.playerid}. Se reintentará desbanearlo más tarde.`
		);
	}
};
