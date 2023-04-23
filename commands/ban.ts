import { SlashCommandBuilder } from "@discordjs/builders";
import { ChatInputCommandInteraction, GuildMember } from "discord.js";
import ban from "../lib/ban";
import environment from "../environment";

export const data = new SlashCommandBuilder()
	.setName("ban")
	.setDescription(
		"Banea a un usuario por tiempo predeterminado de signear en matchmaking"
	)
	.addUserOption(option =>
		option
			.setName("jugador")
			.setDescription("Jugador a banear")
			.setRequired(true)
	)
	.addStringOption(option =>
		option.setName("motivo").setDescription("Motivo de ban").setRequired(true)
	)
	.addIntegerOption(option =>
		option
			.setName("cantidad")
			.setDescription("Tiempo personalizado: Cantidad de minutos/días/horas")
	)
	.addStringOption(option =>
		option
			.setName("tipo")
			.setDescription(
				"Tiempo personalizado: días, minutos, horas, permanente o doble"
			)
			.addChoice("minutos", "m")
			.addChoice("horas", "h")
			.addChoice("días", "d")
			.addChoice("permanente", "perma")
			.addChoice("doble", "doble")
	);

export const permissions = environment.adminRoles;
export const channels = [environment.channelId];

export async function execute(interaction: ChatInputCommandInteraction) {
	try {
		const member = interaction.options.getMember("jugador") as GuildMember;
		const tipo = interaction.options.getString("tipo");
		const cantidad = interaction.options.getInteger("cantidad");
		const motivo = interaction.options.getString("motivo");
		if (member!.roles.cache.get(environment.mmBanRoleId)) {
			interaction.reply({
				content: "El jugador ya se encuentra baneado.",
				ephemeral: true
			});
		} else {
			if (tipo && cantidad) {
				let durationObject;
				switch (tipo) {
					case "perma":
					case "doble":
						return interaction.reply({
							content:
								"No ingrese cantidad si ya eligió ban permanente o doble.",
							ephemeral: true
						});
					case "m":
						if (cantidad < 2) {
							return interaction.reply({
								content: "Ingrese una cantidad de minutos mayor a 2.",
								ephemeral: true
							});
						} else {
							durationObject = { minutes: cantidad };
							break;
						}
					case "h":
						if (cantidad < 1) {
							return interaction.reply({
								content: "Ingrese una cantidad de horas mayor a 0.",
								ephemeral: true
							});
						} else {
							durationObject = { hours: cantidad };
							break;
						}
					case "d":
						if (cantidad < 1) {
							return interaction.reply({
								content: "Ingrese una cantidad de días mayor a 0.",
								ephemeral: true
							});
						} else {
							durationObject = { days: cantidad };
							break;
						}
				}
				await ban(interaction, member, motivo!, durationObject);
			} else if (tipo && !cantidad) {
				if (tipo === "perma") {
					await ban(interaction, member, motivo!, "perma");
				} else if (tipo === "doble") {
					await ban(interaction, member, motivo!, "doble");
				} else {
					return interaction.reply({
						content: "Ingrese una cantidad de minutos/horas/días.",
						ephemeral: true
					});
				}
			} else if (!tipo && cantidad) {
				return interaction.reply({
					content: "Ingrese un tipo: minutos, horas o días.",
					ephemeral: true
				});
			} else {
				await ban(interaction, member!, motivo!);
			}
		}
	} catch (error: any) {
		console.error(error);
		throw new Error(error);
	}
}
