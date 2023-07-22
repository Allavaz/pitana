import { Client, EmbedBuilder, TextChannel } from "discord.js";
import calculateBanLevel from "./calculateBanLevel";
import getLastBan from "./getLastBan";
import { UnbanTask } from "../types";
import environment from "../environment";

export default async function autoUnban(task: UnbanTask, client: Client) {
	try {
		const guild = await client.guilds.fetch(environment.guildId);
		const member = await guild.members.fetch(task.playerid);
		const lastBan = await getLastBan(task.playerid);
		const banLevel = calculateBanLevel(lastBan);
		const channel = (await guild.channels.fetch(
			environment.channelId
		)) as TextChannel;

		await member.roles.remove(
			environment.mmBanRoleId,
			"Pitana: Expiración de ban"
		);

		const unbanEmbed = new EmbedBuilder()
			.setTitle("Usuario desbaneado")
			.setColor("Green")
			.setDescription(
				`El ban de ${member.displayName} / ${member} ha expirado.`
			)
			.setThumbnail(member.user.displayAvatarURL())
			.addFields({ name: "Nivel de ban actual:", value: banLevel.toString() });

		await channel!.send({ embeds: [unbanEmbed] });

		const date = new Date().toISOString();
		console.log(`[${date}] ${member.id} - Autounban`);
	} catch (error) {
		console.log(
			`Se intentó desbanear al jugador ${task.playerid}, pero no se encuentra en el servidor.`
		);
	}
}
