import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import * as dotenv from "dotenv";
import { readdirSync } from "fs";
dotenv.config();

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

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN as string);

(async () => {
	try {
		console.log("Started refreshing application (/) commands.");

		await rest.put(
			Routes.applicationGuildCommands(
				process.env.CLIENT_ID as string,
				process.env.GUILD_ID as string
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
