import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { readdirSync } from "fs";
import environment from "./environment";

const commands = [];
const commandFiles = readdirSync("./commands").filter(file =>
	file.endsWith(".ts")
);

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	if (!command.disabled) {
		commands.push(command.data.toJSON());
	}
}

const rest = new REST({ version: "9" }).setToken(environment.token);

(async () => {
	try {
		console.log("Started refreshing application (/) commands.");

		await rest.put(
			Routes.applicationGuildCommands(
				environment.clientId,
				environment.guildId
			),
			{ body: commands }
		);

		console.log(
			"Successfully reloaded application (/) commands. You can now CTRL-C."
		);
	} catch (error) {
		console.error(error);
	}
})();
