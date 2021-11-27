const { Client, Collection, Intents } = require("discord.js");
const config = require("./config.json");
const fs = require("fs");
const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MEMBERS]
});
const checkTasks = require("./lib/checkTasks");

client.once("ready", () => {
	console.log("Ready!");

	checkTasks(client);
	setInterval(() => {
		checkTasks(client);
	}, 60000);
});

client.commands = new Collection();
const commandFiles = fs
	.readdirSync("./commands")
	.filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

client.on("interactionCreate", async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		if (command.permissions) {
			if (
				!interaction.member.roles.cache.some(v =>
					command.permissions.includes(v.id)
				)
			) {
				return interaction.reply({
					content:
						"Este comando sólo puede ser utilizado por Árbitros y Staffs.",
					ephemeral: true
				});
			}
		}
		if (command.channels) {
			if (!command.channels.includes(interaction.channel.id)) {
				return interaction.reply({
					content: "Este comando no se puede usar en este canal.",
					ephemeral: true
				});
			}
		}
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({
			content: "Ocurrió un error. Avisale a Allavaz!",
			ephemeral: true
		});
	}
});

client.login(config.token);
