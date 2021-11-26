const config = require("../config.json");
const ban = require("../ban");

module.exports = {
	name: "ban",
	description:
		"Banea a un usuario por tiempo predeterminado de signear en matchmaking.",
	usage: "<@usuario> <motivo>",
	execute(message, args) {
		if (args.length > 1) {
			message.guild.fetchMembers().then(() => {
				let member = message.mentions.members.first();
				let reason = args[1];
				for (let i = 2; i < args.length; i++) {
					reason = reason + " " + args[i];
				}
				if (member !== undefined) {
					if (member.roles.has(config.mmbanroleid)) {
						message.reply("el usuario ya se encuentra baneado.");
					} else {
						ban(message, member, reason);
					}
				} else {
					message.reply(
						`usuario desconocido. Recordá mencionarlo! Uso: ${config.prefix}${this.name} ${this.usage}`
					);
				}
			});
		} else {
			message.reply(
				`faltan argumentos. Uso: ${config.prefix}${this.name} ${this.usage}`
			);
		}
	}
};
