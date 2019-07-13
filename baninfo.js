const Discord = require('discord.js');
const config = require('./config.json');
const { MongoClient } = require('mongodb');
const encuser = encodeURIComponent(config.dbusername);
const encpw = encodeURIComponent(config.dbpassword);
const url = `mongodb://${encuser}:${encpw}@${config.dbhostname}:27017/?authMecanism=DEFAULT`;
const { DateTime, Interval } = require('luxon');
const calculatetime = require('./calculatetime');

module.exports = async function(message, member) {
	let msg = await message.channel.send('Conectando a la base de datos...');
	const memberid = member.id.toString();
	const client = new MongoClient(url, {useNewUrlParser: true});

	try {
		let mongoclient = await client.connect();
		const db = mongoclient.db(config.dbname);
		let banlistitem = await db.collection('banlist').findOne({_id: memberid});
		if (banlistitem === null) {
			banlistitem = {isBanned: false, count: 0}
		}
		const now = DateTime.local()
		const baninforembed = new Discord.RichEmbed()
			.setTitle('Información de ban')
			.setColor('BLUE')
			.setThumbnail(member.user.displayAvatarURL)
		if (banlistitem.isBanned) {
			let banlogitem = await db.collection('banlog').findOne({playerid: memberid}, {sort: {startdate: -1}})
			baninforembed.addField('Fecha de inicio:', DateTime.fromISO(banlogitem.startdate).toFormat("dd'/'LL'/'yyyy HH':'mm"))
				.addField('Motivo:', banlogitem.reason);
			if (banlogitem.enddate !== null) {
				const start = DateTime.fromISO(banlogitem.startdate);
				const end = DateTime.fromISO(banlogitem.enddate);
				const initialduration = Interval.fromDateTimes(start, end).toDuration(['days', 'hours', 'minutes']).toObject();
				const remainingduration = Interval.fromDateTimes(now, end).toDuration(['days', 'hours', 'minutes']).toObject();
				baninforembed.setDescription(`${member} se encuentra **baneado** por **${calculatetime(initialduration)}** del matchmaking.`)
					.addField('Fecha de expiración:', DateTime.fromISO(banlogitem.enddate).toFormat("dd'/'LL'/'yyyy HH':'mm"))
					.addField('Tiempo restante del ban:', calculatetime(remainingduration));
			} else {
				baninforembed.setDescription(`${member} se encuentra **baneado indefinidamente** del matchmaking.`)
			}
			baninforembed.addField('Nivel de ban actual:', banlistitem.count);
		} else {
			baninforembed.setDescription(`${member} **no** se encuentra baneado del matchmaking.`)
				.addField('Nivel de ban actual:', banlistitem.count);
		}
		msg.delete();
		message.channel.send(baninforembed);
	} catch(e) {
		console.error(e)
	}
}