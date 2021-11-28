const config = require("../config.json");
const banRemove = require("../lib/banRemove");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("banremove")
		.setDescription("Desbanea a un jugador y borra el ban del historial")
		.addUserOption(option =>
			option
				.setName("jugador")
				.setDescription("Jugador al que se desea desbanear")
				.setRequired(true)
		),
	permissions: config.adminroles,
	channels: [config.channelid],
	async execute(interaction) {
		try {
			const member = interaction.options.getMember("jugador");
			if (member.roles.cache.get(config.mmbanroleid)) {
				await banRemove(interaction, member);
			} else {
				interaction.reply({
					content: "El jugador no se encuentra baneado actualmente.",
					ephemeral: true
				});
			}
		} catch (error) {
			console.error(error);
			throw new Error(error);
		}
	}
};
