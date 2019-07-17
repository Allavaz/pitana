const config = require('../config.json');
const baninfo = require('../baninfo');

module.exports = {
    name: 'baninfo',
    description: 'Informa sobre la situación de un usuario.',
    usage: '<@usuario>',
    execute(message, args) {
        if (args.length > 0) {
            let member = message.mentions.members.first();
            if (member !== undefined) {
                baninfo(message, member);
            } else {
                message.reply(`usuario desconocido. Recordá mencionarlo! Uso: ${config.prefix}${this.name} ${this.usage}`)
            }
        } else {
            baninfo(message, message.member);
        }
    }
}