require("dotenv").config();
const banInfo = require("../lib/banInfo");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("baninfo")
		.setDescription("Informa sobre la situación de un usuario")
		.addUserOption(option =>
			option
				.setName("jugador")
				.setDescription("Jugador al que se desea saber su situación")
				.setRequired(false)
		),
	channels: [process.env.CHANNEL_ID, process.env.BOTS_CHANNEL_ID],
	async execute(interaction) {
		if (!interaction.options.getUser("jugador")) {
			try {
				await banInfo(interaction, interaction.member);
			} catch (error) {
				throw new Error(error);
			}
		} else {
			try {
				await banInfo(interaction, interaction.options.getMember("jugador"));
			} catch (error) {
				throw new Error(error);
			}
		}
	}
};
