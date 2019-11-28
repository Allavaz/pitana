const fs = require('fs');
const Discord = require('discord.js');
const config = require('./config.json');

const client = new Discord.Client();
client.commands = new Discord.Collection();
client.adminroles = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.once('ready', () => {
	console.log('Ready!');

	for (let role of config.adminroles) {
		client.adminroles.set(role, client.guilds.get(config.guildid).roles.get(role));
	}
});

client.on('message', message => {
	if (!message.content.startsWith(config.prefix) || message.author.bot) return;

	const args = message.content.slice(config.prefix.length).split(/ +/);
	const command = args.shift().toLowerCase();

	if (message.channel.id === config.botschannelid) {
		if (!config.freecommands.includes(command)) return;
		if (command === 'baninfo') client.commands.get('baninfo').execute(message, args);
		if (command === 'banranking') client.commands.get('banranking').execute(message);
	}

	if (command === 'help') {
		const helprembed = new Discord.RichEmbed()
			.setTitle('Ayuda')
			.setColor('BLUE')
			.addField(`${config.prefix}help`, 'Muestra este mensaje.')
			.setFooter('Hecho con ♥ por Allavaz.');
		client.commands.map((item) => { 
			helprembed.addField(`${config.prefix + item.name} ${item.usage}`, item.description);
		});
		message.channel.send(helprembed);
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
		message.reply('me rompí. Avisale a Allavaz!');
	}
});

client.login(config.token);