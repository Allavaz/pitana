const config = require('./config.json');
const Discord = require('discord.js');
const { DateTime } = require('luxon');
const { MongoClient } = require('mongodb');
const encuser = encodeURIComponent(config.dbusername);
const encpw = encodeURIComponent(config.dbpassword);
const url = `mongodb://${encuser}:${encpw}@${config.dbhostname}:27017/?authMecanism=DEFAULT`;

const discordclient = new Discord.Client();
const memberid = process.argv[2]

discordclient.on('ready', () => {
    const mongoclient = new MongoClient(url, {useNewUrlParser: true});
    const member = discordclient.guilds.get(config.guildid).members.get(memberid)
    console.log(`Reseteando nivel de ban de ${member.displayName}...`)
    const channel = discordclient.guilds.get(config.guildid).channels.get(config.channelid)
    console.log('Conectando a la base de datos...')
    mongoclient.connect((err, client) => {
        const db = client.db(config.dbname)
        db.collection('banlist').findOneAndUpdate({_id: memberid}, {$set: {count: 0}}, {returnOriginal: false})
            .then((res) => {
                console.log('Nivel de ban reseteado!')
                const resetrembed = new Discord.RichEmbed()
                    .setTitle('Ban reset')
                    .setThumbnail(member.user.displayAvatarURL)
                    .setColor('BLUE')
                    .setDescription(`El nivel de ban de ${member} ha sido reseteado a 0.`)
                    .addField('Fecha del último ban:', DateTime.fromISO(res.value.lastban).toFormat("dd'/'LL'/'yyyy HH':'mm"))
                channel.send(resetrembed)
                    .then(() => {
                        discordclient.destroy()
                            .then(() => process.exit())
                            .catch((e) => console.error(e))
                    })
                    .catch((e) => console.error(e))
            })
            .catch((e) => console.error(e))
    })
})

discordclient.login(config.token);