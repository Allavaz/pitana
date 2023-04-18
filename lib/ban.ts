import * as dotenv from "dotenv";
dotenv.config();
import {
	ChatInputCommandInteraction,
	GuildMember,
	TextChannel,
	EmbedBuilder
} from "discord.js";
import { DateTime, Duration } from "luxon";
import calculateBanLevel from "./calculateBanLevel";
import clientPromise from "./mongodb";
import { BanLogItem, CustomTime } from "../types";

const dateFormat = "dd'/'LL'/'yyyy HH':'mm";

export default async function ban(
	interaction: ChatInputCommandInteraction,
	member: GuildMember,
	reason: string,
	customTime?: CustomTime
) {
	const date = DateTime.local().startOf("minute");
	const userId = member.id;
	try {
		await interaction.deferReply({ ephemeral: true });
		const client = await clientPromise;
		const db = client.db();
		const lastBan = (await db
			.collection(process.env.BAN_LOG_COLLECTION as string)
			.findOne(
				{ playerid: userId },
				{ sort: { startdate: -1 } }
			)) as BanLogItem;
		const banLevel =
			calculateBanLevel(lastBan) + (customTime === "doble" ? 2 : 1);
		const endDate =
			customTime === "perma" || banLevel >= 7
				? null
				: date.plus(
						customTime && customTime !== "doble"
							? customTime
							: { days: JSON.parse(process.env.BAN_DAYS as string)[banLevel] }
				  );
		let endDateISO = null;
		let endDateString = null;
		if (endDate) {
			endDateISO = endDate.toISO();
			endDateString = endDate.toFormat(dateFormat);
		}
		await db.collection(process.env.BAN_LOG_COLLECTION as string).insertOne({
			playerid: userId,
			startdate: date.toISO(),
			enddate: endDateISO,
			reason: reason,
			banlevel: banLevel,
			bannedby: interaction.user.id
		});
		await member.roles.add(process.env.MM_BAN_ROLE_ID as string, reason);
		if (banLevel < 7 && customTime !== "perma") {
			await db
				.collection(process.env.UNBAN_TASKS_COLLECTION as string)
				.insertOne({
					playerid: userId,
					date: endDateISO
				});
		}
		const banEmbed = new EmbedBuilder()
			.setTitle(
				customTime && customTime !== "doble"
					? `Usuario baneado ${
							customTime === "perma"
								? "**indefinidamente**"
								: `por ${Duration.fromObject(customTime).toHuman()}`
					  }`
					: `Usuario baneado ${
							banLevel < 7
								? `por ${
										JSON.parse(process.env.BAN_DAYS as string)[banLevel]
								  } día${banLevel > 2 ? "s" : ""}`
								: "indefinidamente"
					  }.`
			)
			.setColor("Red")
			.setThumbnail(member.user.displayAvatarURL())
			.addFields(
				{
					name: "Nombre:",
					value: `${member.displayName} / ${member}`
				},
				{
					name: "Fecha de inicio:",
					value: date.toFormat(dateFormat)
				},
				{
					name: "Fecha de expiración:",
					value: endDateString || "Indefinido"
				},
				{
					name: "Motivo de ban:",
					value: reason
				},
				{
					name: "Nivel de ban actual:",
					value:
						banLevel.toString() + (customTime === "doble" ? " (Ban doble)" : "")
				}
			);
		if (endDate) {
			const banResetDate = endDate
				.plus({ days: JSON.parse(process.env.RESET_DAYS as string)[banLevel] })
				.toFormat(dateFormat);
			banEmbed.addFields({
				name: "Fecha de reseteo de nivel de ban:",
				value: banResetDate.toString()
			});
		}
		await interaction.editReply("Usuario baneado exitosamente.");
		await interaction.channel!.send({ embeds: [banEmbed] });
		banEmbed.addFields({
			name: "Baneado por:",
			value: `${(interaction.member as GuildMember)!.displayName} / ${
				interaction.member
			}`
		});
		const arbitrajeChannel = (await interaction.client.channels.fetch(
			process.env.ARBITRAJE_CHANNEL_ID as string
		)) as TextChannel;
		await arbitrajeChannel.send({ embeds: [banEmbed] });
	} catch (error: any) {
		console.error(error);
		await member.roles.remove(process.env.MM_BAN_ROLE_ID as string, "rollback");
		const client = await clientPromise;
		const db = client.db();
		await db
			.collection(process.env.BANLOG_COLLECTION as string)
			.findOneAndDelete({ playerid: userId, startdate: date.toISO() });
		await db
			.collection(process.env.UNBAN_TASKS_COLLECTION as string)
			.findOneAndDelete({ playerid: userId });
		throw new Error(error);
	}
}
