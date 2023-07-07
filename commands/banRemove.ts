import banRemove from "../lib/banRemove";
import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import environment from "../environment";

export const data = new SlashCommandBuilder()
	.setName("banremove")
	.setDescription("Desbanea a un jugador y borra el ban del historial")
	.addUserOption(option =>
		option
			.setName("jugador")
			.setDescription("Jugador al que se desea desbanear")
			.setRequired(true)
	);

export const permissions = environment.adminRoles;
export const channels = [environment.channelId];

export async function execute(interaction: ChatInputCommandInteraction) {
	try {
		const member = interaction.options.getMember("jugador") as GuildMember;
		if (!member) {
			return interaction.reply({
				content: "El jugador no se encuentra en el servidor.",
				ephemeral: true
			});
		}
		if (member.roles.cache.get(environment.mmBanRoleId)) {
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
