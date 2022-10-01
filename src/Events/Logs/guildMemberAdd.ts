import { ChannelType, Colors, EmbedBuilder, GuildMember, PartialGuildMember } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
import settings from '../../Structures/Schemas/settingsDB';
// import ChanLogger from '../../Structures/Schemas/LogsChannelDB';// DB
// import GenLogs from '../../Structures/Schemas/GeneralLogsDB'; //SwitchDB

export default new Event('guildMemberAdd', async (member: GuildMember | PartialGuildMember) => {
	try {
		const { guild, user } = member;
		const Data = await settings.findOne({ GuildID: guild.id });
		if (Data?.WelcomeChannel === undefined) return;
		const Channel = guild.channels.cache.get(Data?.WelcomeChannel);

		if (!Channel) return;

		let MessageToSend: string;
		if (guild.rulesChannel) {
			MessageToSend = `Welcome To ${guild.name}'s Server, dont forget to read there rules <#${guild.rulesChannelId}>`;
		} else {
			MessageToSend = `Welcome To ${guild.name}'s Server`;
		}
		const Embed = new EmbedBuilder()
			.setTitle('NEW MEMBER')
			.setDescription(MessageToSend)
			.setAuthor({ name: user.tag, iconURL: member.displayAvatarURL({ size: 512 }) })
			.setColor(Colors.Blue)
			.addFields([
				{
					name: 'Account Created: ',
					value: `<t:${user.createdTimestamp}:R>`,
					inline: true
				},
				{
					name: 'Latest Member Count: ',
					value: `${guild.memberCount}`,
					inline: true
				}
			])
			.setThumbnail(guild.iconURL({ size: 512 }))
			.setFooter({ text: `UserID: ${member.id}` })
			.setTimestamp();

		if (Data.Welcome === true) {
			if (Channel.type === ChannelType.GuildText) Channel.send({ content: `Welcome ${member}`, embeds: [Embed] });
		} else return;
	} catch (error) {
		console.error(error);
		return;
	}
});