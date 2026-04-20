import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("ping")
	.setDescription("Comprueba si el bot está activo");
export async function execute(interaction: ChatInputCommandInteraction) {
	const latency = Date.now() - interaction.createdTimestamp;
	await interaction.reply({ content: `Pong! Latencia: ${latency}ms`, ephemeral: true });
}
