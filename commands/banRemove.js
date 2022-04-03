require("dotenv").config();
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
	permissions: JSON.parse(process.env.ADMIN_ROLES),
	channels: [process.env.CHANNEL_ID],
	async execute(interaction) {
		try {
			const member = interaction.options.getMember("jugador");
			if (member.roles.cache.get(process.env.MM_BAN_ROLE_ID)) {
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
