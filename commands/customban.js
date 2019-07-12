const config = require('../config.json');
const customban = require('../customban');

module.exports = {
	name: 'customban',
	description: 'Banea a un usuario por tiempo personalizado de signear en matchmaking.',
	usage: '<@usuario> <duración> <motivo>',
	execute(message, args) {
		if (args.length > 2) {
			const member = message.mentions.members.first();
			let duration = args[1];
			let durationtype = duration.substring(duration.length-1, duration.length);
			duration = parseInt(duration.substring(0, duration.length-1));
			let durationobject = null;
			switch (durationtype) {
				case 'm':
					durationobject = {minutes: duration}
					break
				case 'h':
					durationobject = {hours: duration}
					break
				case 'd':
					durationobject = {days: duration}
					break
				default:
					break
			}
			let reason = args[2];
			for (let i=3; i<args.length; i++) {
				reason = reason + " " + args[i];
			}
			if (isNaN(duration) || durationobject === null) {
				message.reply('duración incorrecta. El formato de la duración es <número><h/d/m> (horas, días y meses, respectivamente)')
			} else if (duration < 1 || (durationtype === 'm' && duration < 2)) {
				message.reply('por favor ingresá un valor mayor a **un minuto**.')
			} else {
				if (member !== undefined) {
					if (member.roles.has(config.mmbanroleid)) {
						message.reply('el usuario ya se encuentra baneado.');
					} else {
						customban(message, member, durationobject, reason);
					}
				} else {
					message.reply("usuario desconocido. Recordá mencionarlo! Uso: " + config.prefix + "customban <@usuario> <duración> <motivo>")
				}
			}
		} else {
			message.reply("faltan argumentos. Uso: " + config.prefix + "customban <@usuario> <duración> <motivo>");
		}
	}
}