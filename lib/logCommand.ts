import { ChatInputCommandInteraction } from "discord.js";

export default function logCommand(interaction: ChatInputCommandInteraction) {
	const date = new Date().toISOString();
	const user = interaction.user;
	const commandName = interaction.commandName;
	const args = interaction.options.data.reduce((acc: any, cur) => {
		acc[cur.name] = cur.value;
		return acc;
	}, {});

	console.log(
		`[${date}] ${user.id} - ${commandName} - ${JSON.stringify(args)}`
	);
}
