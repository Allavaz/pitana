const config = require('./config.json');
const Discord = require('discord.js');
const { MongoClient } = require('mongodb');
const encuser = encodeURIComponent(config.dbusername);
const encpw = encodeURIComponent(config.dbpassword);
const url = `mongodb://${encuser}:${encpw}@${config.dbhostname}:27017/?authMecanism=DEFAULT`;
const { DateTime } = require('luxon');
const path = require('path');
const { exec } = require('child_process');

module.exports = async function(message, member, reason){
    let msg = await message.channel.send('Añadiendo rol de ban...');
    member.addRole(config.mmbanroleid, reason);
    let date = DateTime
        .local()
        .setZone('America/Buenos_Aires')
        .startOf('minute');
    const unbanpath = path.join(__dirname, 'autounban.js');
    const banresetpath = path.join(__dirname, 'banreset.js');
    const memberid = member.id.toString();
    const client = new MongoClient(url, {useNewUrlParser: true});

    try {
        msg.edit('Conectando con la base de datos...')
        let mongoclient = await client.connect();
        const db = mongoclient.db(config.dbname);
        msg.edit('Incrementando nivel de ban...');
        let res = await db.collection('banlist').findOneAndUpdate(
            {_id: memberid}, 
            {
                $set: {lastban: date.toISO(), isBanned: true}, 
                $inc: {count: 1}
            }, 
            {upsert: true, returnOriginal: false}
        );
        if (res.value.count < 7) {
            exec(`schtasks /Create /TN mmbans\\${memberid} /TR "node ${unbanpath} ${memberid}" /SD ${date.plus({days: config.bandays[res.value.count]}).toFormat("LL'/'dd'/'yyyy")} /ST ${date.plus({days: config.bandays[res.value.count]}).toFormat("HH':'mm")} /SC ONCE /F`);
            exec(`schtasks /Create /TN bansreset\\${memberid} /TR "node ${banresetpath} ${memberid}" /SD ${date.plus({months: 2}).toFormat("LL'/'dd'/'yyyy")} /ST ${date.plus({months: 2}).toFormat("HH':'mm")} /SC ONCE /F`);
        } else {
            exec(`schtasks /Delete /TN bansreset\\${memberid} /F`);
        }
        msg.edit('Cargando ban al historial...');
        await db.collection('banlog').insertOne({
            playerid: memberid,
            startdate: date.toISO(),
            enddate: res.value.count < 7 ? date.plus({days: config.bandays[res.value.count]}).toISO() : null,
            reason: reason
        });
        const banrembed = new Discord.RichEmbed()
            .setTitle(`Usuario baneado ${res.value.count < 7 ? `por ${config.bandays[res.value.count]} día${res.value.count > 3 ? 's' : ''}` : 'indefinidamente'}.`)
            .setColor('RED')
            .setThumbnail(member.user.displayAvatarURL)
            .addField('Nombre:', member)
            .addField('Fecha de inicio:', date.toFormat("dd'/'LL'/'yyyy HH':'mm"))
            .addField('Fecha de expiración:', res.value.count < 7 ? date.plus({days: config.bandays[res.value.count]}).toFormat("dd'/'LL'/'yyyy HH':'mm") : 'Indefinido')
            .addField('Motivo de ban:', reason)
            .addField('Nivel de ban actual:', res.value.count)
            .setFooter('Baneado por: ' + message.member.displayName, message.author.displayAvatarURL);
        msg.delete();
        message.channel.send(banrembed);
    } catch(e) {
        console.error(e);
    }
}