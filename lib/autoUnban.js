const { MessageEmbed } = require("discord.js");
const config = require("../config");
const calculateBanLevel = require("./calculateBanLevel");
const getBanHistory = require("./getBanHistory");

module.exports = async (task, client) => {
	const banHistory = await getBanHistory(task.playerid);
	const banLevel = calculateBanLevel(banHistory);
	const guild = await client.guilds.fetch(config.guildid);
	const member = await guild.members.fetch(task.playerid);
	const channel = await guild.channels.fetch(config.channelid);

	await member.roles.remove(config.mmbanroleid, "Auto Unban");

	const unbanEmbed = new MessageEmbed()
		.setTitle("Usuario desbaneado")
		.setColor("GREEN")
		.setDescription(`El ban de ${member} ha expirado.`)
		.setThumbnail(member.user.displayAvatarURL())
		.addField("Nivel de ban actual:", banLevel.toString());

	await channel.send({ embeds: [unbanEmbed] });
};
