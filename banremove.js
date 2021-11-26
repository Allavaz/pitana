const Discord = require("discord.js");
const config = require("./config.json");
const path = require("path");
const { exec } = require("child_process");
const { MongoClient } = require("mongodb");
const encuser = encodeURIComponent(config.dbusername);
const encpw = encodeURIComponent(config.dbpassword);
const url = `mongodb://${encuser}:${encpw}@${config.dbhostname}:27017/?authMecanism=DEFAULT`;
const { DateTime } = require("luxon");

module.exports = async function (message, member) {
	let msg = await message.channel.send("Conectando a la base de datos...");
	const banresetpath = path.join(__dirname, "banreset.js");
	const memberid = member.id.toString();
	const client = new MongoClient(url, { useNewUrlParser: true });
	try {
		let mongoclient = await client.connect();
		const db = mongoclient.db(config.dbname);
		msg.edit("Eliminando ban del historial...");
		await db
			.collection("banlog")
			.findOneAndDelete({ playerid: memberid }, { sort: { startdate: -1 } });
		let lastbanlog = await db
			.collection("banlog")
			.findOne({ playerid: memberid }, { sort: { startdate: -1 } });
		let banlistitem = await db.collection("banlist").findOneAndUpdate(
			{ _id: memberid },
			{
				$set: {
					lastban: lastbanlog === null ? null : lastbanlog.startdate,
					isBanned: false
				},
				$inc: { count: -1 }
			},
			{ returnOriginal: false }
		);
		exec(`schtasks /Delete /TN mmbans\\${memberid} /F`);
		if (banlistitem.value.count === 0) {
			exec(`schtasks /Delete /TN bansreset\\${memberid} /F`);
		} else {
			const now = DateTime.local().plus({ minutes: 5 }).toISO();
			if (
				DateTime.fromISO(banlistitem.lastban)
					.plus({ days: config.banreset[banlistitem.count] })
					.toISO() < now
			) {
				await db
					.collection("banlist")
					.findOneAndUpdate({ _id: memberid }, { $set: { count: 0 } });
			} else {
				exec(
					`schtasks /Create /TN bansreset\\${memberid} /TR "node ${banresetpath} ${memberid}" /SD ${DateTime.fromISO(
						lastbanlog.startdate
					)
						.plus({ days: config.banreset[banlistitem.count] })
						.toFormat("LL'/'dd'/'yyyy")} /ST ${DateTime.fromISO(
						lastbanlog.startdate
					)
						.plus({ days: config.banreset[banlistitem.count] })
						.toFormat("HH':'mm")} /SC ONCE /F`
				);
			}
		}
		msg.edit("Removiendo rol de ban...");
		await member.removeRole(config.mmbanroleid);
		const removebanrembed = new Discord.RichEmbed()
			.setTitle("Ban removido")
			.setColor("GREEN")
			.setThumbnail(member.user.displayAvatarURL)
			.setDescription(`El ban de ${member} ha sido removido.`)
			.addField("Nivel de ban actual:", banlistitem.value.count)
			.setFooter(
				`Ban removido por: ${message.member.displayName}`,
				message.author.displayAvatarURL
			);
		msg.delete();
		message.channel.send(removebanrembed);
	} catch (e) {
		console.error(e);
	}
};
