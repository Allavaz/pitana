const { MessageEmbed } = require("discord.js");
require("dotenv").config();
const { MongoClient } = require("mongodb");
const encuser = encodeURIComponent(process.env.DB_USERNAME);
const encpw = encodeURIComponent(process.env.DB_PASSWORD);
const url = `mongodb+srv://${encuser}:${encpw}@${process.env.DB_HOSTNAME}/?authMecanism=DEFAULT`;

module.exports = async function (interaction) {
	const members = await interaction.guild.members.fetch();
	const client = new MongoClient(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true
	});
	try {
		let mongoclient = await client.connect();
		const db = mongoclient.db(process.env.DB_NAME);
		let docs = await db
			.collection("banlog")
			.aggregate([
				{
					$group: {
						_id: "$playerid",
						bans: {
							$count: {}
						}
					}
				},
				{
					$sort: {
						bans: -1
					}
				},
				{
					$limit: 10
				}
			])
			.toArray();
		for (let i = 0; i < docs.length; i++) {
			let name;
			try {
				name = await members.get(docs[i]._id).displayName;
			} catch (e) {
				name = null;
			}
			if (name !== null) {
				docs[i].name = name;
			}
		}
		let list = "";
		const banRankingEmbed = new MessageEmbed()
			.setTitle("Ranking de baneados")
			.setColor("BLUE");
		try {
			banRankingEmbed.setThumbnail(
				members.get(docs[0]._id).user.displayAvatarURL()
			);
		} catch (err) {
			console.log("banRanking: Hay jugadores que no se pudieron encontrar");
		}
		for (let i = 0; i < docs.length; i++) {
			list = list + `${i + 1}. **${docs[i].name}**, *${docs[i].bans} bans*\n`;
		}
		banRankingEmbed.setDescription(list);
		interaction.reply({ embeds: [banRankingEmbed] });
	} catch (error) {
		console.error(error);
		throw new Error(error);
	}
};
