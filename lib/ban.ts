import environment from "../environment";
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
			.collection(environment.banLogCollection)
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
							: { days: environment.banDays[banLevel] }
				  );
		let endDateISO = null;
		let endDateString = null;
		if (endDate) {
			endDateISO = endDate.toISO();
			endDateString = endDate.toFormat(dateFormat);
		}
		await db.collection(environment.banLogCollection).insertOne({
			playerid: userId,
			startdate: date.toISO(),
			enddate: endDateISO,
			reason: reason,
			banlevel: banLevel,
			bannedby: interaction.user.id
		});
		await member.roles.add(environment.mmBanRoleId, reason);
		if (banLevel < 7 && customTime !== "perma") {
			await db.collection(environment.unbanTasksCollection).insertOne({
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
								? `por ${environment.banDays[banLevel]} día${
										banLevel > 2 ? "s" : ""
								  }`
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
				.plus({ days: environment.resetDays[banLevel] })
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
			environment.arbitrajeChannelId
		)) as TextChannel;
		await arbitrajeChannel.send({ embeds: [banEmbed] });
	} catch (error: any) {
		console.error(error);
		await member.roles.remove(environment.mmBanRoleId, "rollback");
		const client = await clientPromise;
		const db = client.db();
		await db
			.collection(environment.banLogCollection)
			.findOneAndDelete({ playerid: userId, startdate: date.toISO() });
		await db
			.collection(environment.unbanTasksCollection)
			.findOneAndDelete({ playerid: userId });
		throw new Error(error);
	}
}
