const Discord = require('discord.js');
const config = require('./config.json');
const path = require('path');
const { exec } = require('child_process');
const { MongoClient } = require('mongodb');
const encuser = encodeURIComponent(config.dbusername);
const encpw = encodeURIComponent(config.dbpassword);
const url = `mongodb://${encuser}:${encpw}@${config.dbhostname}:27017/?authMecanism=DEFAULT`;
const { DateTime } = require('luxon');

module.exports = async function(message, member) {
	let msg = await message.channel.send('Removiendo rol de ban...');
	member.removeRole(config.mmbanroleid);
	const banresetpath = path.join(__dirname, 'banreset.js');
	const memberid = member.id.toString();
	const client = new MongoClient(url, {useNewUrlParser: true});

	try {
		msg.edit('Conectando a la base de datos...');
		let mongoclient = await client.connect();
		const db = mongoclient.db(config.dbname);
		msg.edit('Eliminando ban del historial...');
		await db.collection('banlog').findOneAndDelete(
			{}, 
			{sort: {startdate: -1}}
		);
		let lastbanlog = await db.collection('banlog').findOne(
			{}, 
			{sort: {startdate: -1}}
		);
		let banlistitem = await db.collection('banlist').findOneAndUpdate(
			{_id: memberid}, 
			{
				$set: {lastban: lastbanlog === null ? null : lastbanlog.startdate, isBanned: false}, 
				$inc: {count: -1}
			},
			{returnOriginal: false}
		);
		exec(`schtasks /Delete /TN mmbans\\${memberid} /F`);
		if (banlistitem.value.count === 0) {
			exec(`schtasks /Delete /TN bansreset\\${memberid} /F`);
		} else {
			exec(`schtasks /Create /TN bansreset\\${memberid} /TR "node ${banresetpath} ${memberid}" /SD ${DateTime.fromISO(lastbanlog.startdate).plus(config.banreset).toFormat('LL\'/\'dd\'/\'yyyy')} /ST ${DateTime.fromISO(lastbanlog.startdate).plus({months: 2}).toFormat('HH\':\'mm')} /SC ONCE /F`);
		}
		const removebanrembed = new Discord.RichEmbed()
			.setTitle('Ban removido')
			.setColor('GREEN')
			.setThumbnail(member.user.displayAvatarURL)
			.setDescription(`El ban de ${member} ha sido removido.`)
			.addField('Nivel de ban actual:', banlistitem.value.count)
			.setFooter(`Ban removido por: ${message.member.displayName}`, message.author.displayAvatarURL);
		msg.delete();
		message.channel.send(removebanrembed);
	} catch(e) {
		console.error(e);
	}
};

