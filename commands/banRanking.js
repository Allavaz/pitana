require("dotenv").config();
const banranking = require("../lib/banRanking");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("banranking")
		.setDescription("Muestra los top 10 baneados"),
	channels: [process.env.CHANNEL_ID, process.env.BOTS_CHANNEL_ID],
	disabled: true,
	async execute(interaction) {
		await banranking(interaction);
	}
};
