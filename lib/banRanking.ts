import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import clientPromise from "./mongodb";
import environment from "../environment";

export default async function banRanking(
	interaction: ChatInputCommandInteraction
) {
	const members = await interaction.guild!.members.fetch();
	try {
		const client = await clientPromise;
		const db = client.db();
		let docs = await db
			.collection(environment.banLogCollection)
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
				name = members.get(docs[i]._id)!.displayName;
			} catch (e) {
				name = null;
			}
			if (name !== null) {
				docs[i].name = name;
			}
		}
		let list = "";
		const banRankingEmbed = new EmbedBuilder()
			.setTitle("Ranking de baneados")
			.setColor("Blue");
		try {
			banRankingEmbed.setThumbnail(
				members.get(docs[0]._id)!.user.displayAvatarURL()
			);
		} catch (err) {
			console.log("banRanking: Hay jugadores que no se pudieron encontrar");
		}
		for (let i = 0; i < docs.length; i++) {
			list = list + `${i + 1}. **${docs[i].name}**, *${docs[i].bans} bans*\n`;
		}
		banRankingEmbed.setDescription(list);
		interaction.reply({ embeds: [banRankingEmbed] });
	} catch (error: any) {
		console.error(error);
		throw new Error(error);
	}
}
