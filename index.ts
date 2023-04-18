import {
	Client,
	Collection,
	GatewayIntentBits,
	GuildMember,
	Interaction,
	InteractionReplyOptions
} from "discord.js";
import * as dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import { Settings } from "luxon";
import checkTasks from "./lib/checkTasks";

Settings.defaultZone = "America/Argentina/Buenos_Aires";
Settings.defaultLocale = "es";

interface ClientWithCommands<_> extends Client<boolean> {
	commands: Collection<string, any>;
}

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
}) as ClientWithCommands<boolean>;

client.once("ready", () => {
	console.log("Ready!");

	checkTasks(client);
	setInterval(() => {
		checkTasks(client);
	}, 600000);
});

client.commands = new Collection();
const commandFiles = fs
	.readdirSync("./commands")
	.filter(file => file.endsWith(".ts"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.data.name, command);
}

client.on("interactionCreate", async (interaction: Interaction) => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		if (command.permissions) {
			if (
				!(interaction.member as GuildMember).roles.cache.some(r =>
					command.permissions.includes(r.id)
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
			if (!command.channels.includes(interaction.channel!.id)) {
				return interaction.reply({
					content: "Este comando no se puede usar en este canal.",
					ephemeral: true
				});
			}
		}
		return await command.execute(interaction);
	} catch (error) {
		console.error(error);
		return interaction.reply({
			content: "Ocurrió un error. Avisale a Allavaz!",
			ephemeral: true
		});
	}
});

client.login(process.env.TOKEN);
