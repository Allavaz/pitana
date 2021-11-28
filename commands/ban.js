const config = require("../config.json");
const ban = require("../lib/ban");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
	data: new SlashCommandBuilder()
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
		.addStringOption(option =>
			option
				.setName("duracion")
				.setDescription(
					"Duración personalizada del ban. El formato de la duración es <número><m/h/d/perma>"
				)
		),
	permissions: config.adminroles,
	channels: [config.channelid],
	async execute(interaction) {
		const member = interaction.options.getMember("jugador");
		if (member.roles.cache.get(config.mmbanroleid)) {
			interaction.reply({
				content: "El jugador ya se encuentra baneado.",
				ephemeral: true
			});
		} else {
			let durationObject;
			if (interaction.options.getString("duracion")) {
				const duration = interaction.options.getString("duracion").trim();
				let durationType;
				let durationNumber;
				if (duration === "perma") {
					durationObject = duration;
				} else {
					durationType = duration.substring(
						duration.length - 1,
						duration.length
					);
					durationNumber = parseInt(duration.substring(0, duration.length - 1));
					switch (durationType) {
						case "m":
							durationObject = { minutes: durationNumber };
							break;
						case "h":
							durationObject = { hours: durationNumber };
							break;
						case "d":
							durationObject = { days: durationNumber };
							break;
						default:
							break;
					}
				}
				if (
					(isNaN(durationNumber) && duration !== "perma") ||
					durationObject === null
				) {
					interaction.reply({
						content:
							"Duración incorrecta. El formato de la duración es <número><m/h/d/perma> (minutos, horas y días, respectivamente)",
						ephemeral: true
					});
				} else if (
					duration !== "perma" &&
					(durationNumber < 1 || (durationType === "m" && duration < 2))
				) {
					interaction.reply({
						content: "Por favor ingresá un valor mayor a **un minuto**.",
						ephemeral: true
					});
				} else {
					await ban(
						interaction,
						member,
						interaction.options.getString("motivo"),
						durationObject
					);
				}
			} else {
				await ban(
					interaction,
					member,
					interaction.options.getString("motivo")
				);
			}
		}
	}
};
