const fs = require("fs");
const Discord = require("discord.js");
const config = require("./config.json");

const client = new Discord.Client();
client.commands = new Discord.Collection();
client.adminroles = new Discord.Collection();

const commandFiles = fs
	.readdirSync("./commands")
	.filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.once("ready", () => {
	console.log("Ready!");

	for (let role of config.adminroles) {
		client.adminroles.set(
			role,
			client.guilds.get(config.guildid).roles.get(role)
		);
	}
});

client.on("message", message => {
	if (!message.content.startsWith(config.prefix) || message.author.bot) return;

	const args = message.content.slice(config.prefix.length).split(/ +/);
	const command = args.shift().toLowerCase();

	if (command === "help") {
		if (
			message.channel.id === config.botschannelid ||
			message.channel.id === config.channelid
		) {
			let msg = `**${config.prefix}help**\nMuestra este mensaje.\n\n`;
			client.commands.map(item => {
				msg =
					msg +
					`**${config.prefix + item.name} ${item.usage}**\n${
						item.description
					}\n\n`;
			});
			const helprembed = new Discord.RichEmbed()
				.setTitle("Ayuda")
				.setColor("BLUE")
				.setFooter("Hecho con ♥ por Allavaz.")
				.setDescription(msg)
				.setThumbnail(client.user.displayAvatarURL);
			message.channel.send(helprembed);
		}
	}

	if (message.channel.id === config.botschannelid) {
		if (!config.freecommands.includes(command)) return;
		else client.commands.get(command).execute(message, args);
	}

	if (!client.commands.has(command)) return;
	if (message.channel.id !== config.channelid) return;

	try {
		for (let role of client.adminroles) {
			if (message.member.roles.has(role[0])) {
				client.commands.get(command).execute(message, args);
				break;
			}
		}
	} catch (e) {
		console.error(e);
		message.reply("me rompí. Avisale a Allavaz!");
	}
});

client.login(config.token);
