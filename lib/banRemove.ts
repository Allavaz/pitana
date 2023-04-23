import {
	ChatInputCommandInteraction,
	GuildMember,
	EmbedBuilder,
	TextChannel
} from "discord.js";
import calculateBanLevel from "./calculateBanLevel";
import clientPromise from "./mongodb";
import { BanLogItem } from "../types";
import environment from "../environment";

export default async function banRemove(
	interaction: ChatInputCommandInteraction,
	member: GuildMember
) {
	const userId = member.id;
	try {
		await interaction.deferReply({ ephemeral: true });
		const client = await clientPromise;
		const db = client.db();
		await db
			.collection(environment.banLogCollection)
			.findOneAndDelete({ playerid: userId }, { sort: { startdate: -1 } });
		await db
			.collection(environment.unbanTasksCollection)
			.findOneAndDelete({ playerid: userId });
		const lastBan = (await db
			.collection(environment.banLogCollection)
			.findOne(
				{ playerid: userId },
				{ sort: { startdate: -1 } }
			)) as BanLogItem;
		const banLevel = calculateBanLevel(lastBan);
		await member.roles.remove(environment.mmBanRoleId);
		const removeBanEmbed = new EmbedBuilder()
			.setTitle("Ban removido")
			.setColor("Green")
			.setThumbnail(member.displayAvatarURL())
			.setDescription(
				`El ban de ${member.displayName} / ${member} ha sido removido.`
			)
			.addFields({ name: "Nivel de ban actual:", value: banLevel.toString() });
		await interaction.editReply("Usuario desbaneado exitosamente.");
		await interaction.channel!.send({ embeds: [removeBanEmbed] });
		removeBanEmbed.addFields({
			name: "Ban removido por:",
			value: `${
				(interaction.member as GuildMember).displayName
			} / ${interaction.member!}`
		});
		const arbitrajeChannel = (await interaction.client.channels.fetch(
			environment.arbitrajeChannelId
		)) as TextChannel;
		await arbitrajeChannel.send({ embeds: [removeBanEmbed] });
	} catch (error: any) {
		await member.roles.add(environment.mmBanRoleId);
		throw new Error(error);
	}
}
