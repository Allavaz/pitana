const { MessageEmbed } = require("discord.js");
require("dotenv").config();
const calculateBanLevel = require("./calculateBanLevel");
const getLastBan = require("./getLastBan");

module.exports = async (task, client) => {
	try {
		const guild = await client.guilds.fetch(process.env.GUILD_ID);
		const member = await guild.members.fetch(task.playerid);
		const lastBan = await getLastBan(task.playerid);
		const banLevel = calculateBanLevel(lastBan);
		const channel = await guild.channels.fetch(process.env.CHANNEL_ID);

		await member.roles.remove(
			process.env.MM_BAN_ROLE_ID,
			"Pitana: Expiración de ban"
		);

		const unbanEmbed = new MessageEmbed()
			.setTitle("Usuario desbaneado")
			.setColor("GREEN")
			.setDescription(
				`El ban de ${member.displayName} / ${member} ha expirado.`
			)
			.setThumbnail(member.user.displayAvatarURL())
			.addField("Nivel de ban actual:", banLevel.toString());

		await channel.send({ embeds: [unbanEmbed] });
	} catch (error) {
		throw new Error(
			`No se encontró al jugador ${task.playerid}. Se reintentará desbanearlo más tarde.`
		);
	}
};
