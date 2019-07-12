const config = require('../config.json');
const banremove = require('../banremove')

module.exports = {
    name: 'banremove',
    description: 'Desbanea a un usuario permitiendole signear en matchmaking.',
    usage: '<@usuario>',
    execute(message, args) {
        if (args.length > 0) {
            let member = message.mentions.members.first();
            if (member !== undefined) {
                if (member.roles.has(config.mmbanroleid)) {
                    banremove(message, member);
                } else {
                    message.reply('el usuario no se encuentra baneado.');
                }
            } else {
                message.reply("usuario desconocido. Recordá mencionarlo! Uso: " + config.prefix + "banremove <@usuario>")
            }
        } else {
            message.reply("faltan argumentos. Uso: " + config.prefix + "banremove <@usuario>");
        }
    }
}