const config = require('../config.json');
const customban = require('../customban');

module.exports = {
	name: 'customban',
	description: 'Banea a un usuario por tiempo personalizado de signear en matchmaking.',
	usage: '<@usuario> <#m/#h/#d/perma> <motivo>',
	execute(message, args) {
		if (args.length > 2) {
			let durationobject = null;
			const member = message.mentions.members.first();
			let duration = args[1];
			let durationtype;
			if (duration === 'perma') {
				durationobject = duration;
			} else {
				durationtype = duration.substring(duration.length-1, duration.length);
				duration = parseInt(duration.substring(0, duration.length-1));
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
			}
			let reason = args[2];
			for (let i=3; i<args.length; i++) {
				reason = reason + " " + args[i];
			}
			if ((isNaN(duration) && duration !== 'perma') || durationobject === null) {
				message.reply('duración incorrecta. El formato de la duración es <número><m/h/d/perma> (minutos, horas y días, respectivamente)')
			} else if (duration !== 'perma' && (duration < 1 || (durationtype === 'm' && duration < 2))) {
				message.reply('por favor ingresá un valor mayor a **un minuto**.')
			} else {
				if (member !== undefined) {
					if (member.roles.has(config.mmbanroleid)) {
						message.reply('el usuario ya se encuentra baneado.');
					} else {
						customban(message, member, durationobject, reason);
					}
				} else {
					message.reply(`usuario desconocido. Recordá mencionarlo! Uso: ${config.prefix}${this.name} ${this.usage}`)
				}
			}
		} else {
			message.reply(`faltan argumentos. Uso: ${config.prefix}${this.name} ${this.usage}`);
		}
	}
}