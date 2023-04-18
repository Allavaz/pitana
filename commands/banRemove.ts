import * as dotenv from "dotenv";
dotenv.config();
import banRemove from "../lib/banRemove";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, GuildMember } from "discord.js";

export const data = new SlashCommandBuilder()
	.setName("banremove")
	.setDescription("Desbanea a un jugador y borra el ban del historial")
	.addUserOption(option =>
		option
			.setName("jugador")
			.setDescription("Jugador al que se desea desbanear")
			.setRequired(true)
	);
export const permissions = JSON.parse(process.env.ADMIN_ROLES as string);
export const channels = [process.env.CHANNEL_ID];
export async function execute(interaction: ChatInputCommandInteraction) {
	try {
		const member = interaction.options.getMember("jugador") as GuildMember;
		if (member.roles.cache.get(process.env.MM_BAN_ROLE_ID as string)) {
			await banRemove(interaction, member);
		} else {
			interaction.reply({
				content: "El jugador no se encuentra baneado actualmente.",
				ephemeral: true
			});
		}
	} catch (error: any) {
		console.error(error);
		throw new Error(error);
	}
}
