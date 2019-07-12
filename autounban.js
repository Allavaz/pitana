const Discord = require('discord.js');
const config = require('./config.json');
const { exec } = require('child_process');
const { MongoClient } = require('mongodb');
const encuser = encodeURIComponent(config.dbusername);
const encpw = encodeURIComponent(config.dbpassword);
const url = `mongodb://${encuser}:${encpw}@${config.dbhostname}:27017/?authMecanism=DEFAULT`;

const discordclient = new Discord.Client();

discordclient.once('ready', () => {
    const memberid = process.argv[2];
    const member = discordclient.guilds.get(config.guildid).members.get(memberid);
    console.log(`Desbaneando a ${member.displayName}...`);
    const channel = discordclient.guilds.get(config.guildid).channels.get(config.channelid);
    const mongoclient = new MongoClient(url, {useNewUrlParser: true});
    console.log('Conectando a la base de datos...');
    mongoclient.connect((err, client) => {
        const db = client.db(config.dbname);
        db.collection('banlist').findOneAndUpdate({_id: memberid}, {$set: {isBanned: false}})
            .then((res) => {
                console.log('Desbaneado en la base de datos!');
                const unbanrembed = new Discord.RichEmbed()
                    .setTitle('Usuario desbaneado')
                    .setColor('GREEN')
                    .setThumbnail(member.user.displayAvatarURL)
                    .addField('Nivel de ban actual:', res.value.count)
                    .setDescription(`El ban de ${member} ha expirado.`);
                console.log('Removiendo rol de ban...');
                member.removeRole(config.mmbanroleid, 'Ban expirado')
                    .then(() => {
                        console.log('Eliminando tarea programada de desbaneo...');
                        exec(`schtasks /Delete /TN mmbans\\${memberid} /F`, (err, stdout, stderr) => {
                            if (err !== null) {
                                console.log(err);
                            }
                        });
                        channel.send(unbanrembed).then(() => {
                            discordclient.destroy()
                                .then(() => process.exit())
                                .catch((err) => console.error(err))
                        })
                        .catch((err) => console.error(err))
                    })
                    .catch((err) => console.error(err))
            .catch((err) => console.error(err));
        });
    });
}); 

discordclient.login(config.token);