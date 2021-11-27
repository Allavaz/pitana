const banranking = require("../lib/banRanking");
const config = require("../config.json");
const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("banranking")
		.setDescription("Muestra los top 10 baneados"),
	channels: [config.channelid, config.botschannelid],
	async execute(interaction) {
		await banranking(interaction);
	}
};
