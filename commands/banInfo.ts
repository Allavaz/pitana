import banInfo from "../lib/banInfo";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import environment from "../environment";

export const data = new SlashCommandBuilder()
	.setName("baninfo")
	.setDescription("Informa sobre la situación de un usuario")
	.addUserOption(option =>
		option
			.setName("jugador")
			.setDescription("Jugador al que se desea saber su situación")
			.setRequired(false)
	);
export const channels = [
	environment.channelId,
	environment.botsChannelId,
	environment.arbitrajeChannelId
];
export async function execute(interaction: ChatInputCommandInteraction) {
	if (!interaction.options.getUser("jugador")) {
		try {
			await banInfo(interaction, interaction.member as GuildMember);
		} catch (error: any) {
			throw new Error(error);
		}
	} else {
		try {
			await banInfo(
				interaction,
				interaction.options.getMember("jugador") as GuildMember
			);
		} catch (error: any) {
			throw new Error(error);
		}
	}
}
