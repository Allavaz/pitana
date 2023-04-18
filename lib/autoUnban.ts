import { Client, EmbedBuilder, TextChannel } from "discord.js";
import * as dotenv from "dotenv";
dotenv.config();
import calculateBanLevel from "./calculateBanLevel";
import getLastBan from "./getLastBan";
import { UnbanTask } from "../types";

export default async function autoUnban(task: UnbanTask, client: Client) {
	try {
		const guild = await client.guilds.fetch(process.env.GUILD_ID as string);
		const member = await guild.members.fetch(task.playerid);
		const lastBan = await getLastBan(task.playerid);
		const banLevel = calculateBanLevel(lastBan);
		const channel = (await guild.channels.fetch(
			process.env.CHANNEL_ID as string
		)) as TextChannel;

		await member.roles.remove(
			process.env.MM_BAN_ROLE_ID as string,
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
	} catch (error) {
		throw new Error(`No se encontró al jugador ${task.playerid}.`);
	}
}
