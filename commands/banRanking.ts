import banranking from "../lib/banRanking";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction } from "discord.js";
import environment from "../environment";

export const data = new SlashCommandBuilder()
	.setName("banranking")
	.setDescription("Muestra los top 10 baneados");
export const channels = [environment.channelId, environment.botsChannelId];
export const disabled = true;
export async function execute(interaction: ChatInputCommandInteraction) {
	await banranking(interaction);
}
