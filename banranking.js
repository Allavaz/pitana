const Discord = require('discord.js');
const config = require('./config.json');
const { MongoClient } = require('mongodb');
const encuser = encodeURIComponent(config.dbusername);
const encpw = encodeURIComponent(config.dbpassword);
const url = `mongodb://${encuser}:${encpw}@${config.dbhostname}:27017/?authMecanism=DEFAULT`;

module.exports = async function(message) {
	let msg = await message.channel.send('Conectando a la base de datos...');
	await message.guild.fetchMembers();
	const client = new MongoClient(url, {useNewUrlParser: true});
	let members = [];
	try {
		let mongoclient = await client.connect();
		const db = mongoclient.db(config.dbname);
		let docs = await db.collection('banlog').aggregate(
			[{$group: {
				_id: '$playerid',
				bans: {
					$sum: 1
				}
			}}]
		).sort({bans: -1})
			.toArray();
		for (let i=0; i<docs.length; i++) {
			let name;
			try {
				name = await message.guild.members.get(docs[i]._id).displayName;
			} catch(e) {
				name = null;
			}
			if (name !== null) {
				members.push({
					id: docs[i]._id,
					name: name,
					bans: docs[i].bans
				});
			}
			members = members.slice(0, 10);
		}
		let list = '';
		const banrankingrembed = new Discord.RichEmbed()
			.setTitle('Ranking de Baneados')
			.setColor('BLUE')
			.setThumbnail(message.guild.members.get(members[0].id).user.displayAvatarURL);
		for (let i=0; i<members.length; i++) {
			list = list + `${i+1}. **${members[i].name}**, *${members[i].bans} bans*\n`;
		}
		banrankingrembed.setDescription(list);
		msg.delete();
		message.channel.send(banrankingrembed);
	} catch(e) {
		console.error(e);
	}
};