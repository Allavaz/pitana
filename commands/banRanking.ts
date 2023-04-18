import * as dotenv from "dotenv";
dotenv.config();
import banranking from "../lib/banRanking";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("banranking")
	.setDescription("Muestra los top 10 baneados");
export const channels = [process.env.CHANNEL_ID, process.env.BOTS_CHANNEL_ID];
export const disabled = true;
export async function execute(interaction: ChatInputCommandInteraction) {
	await banranking(interaction);
}
