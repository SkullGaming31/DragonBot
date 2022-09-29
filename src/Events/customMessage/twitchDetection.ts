import { ChannelType, Colors, EmbedBuilder, Message } from 'discord.js';
import { Event } from '../../../src/Structures/Event';

import settings from '../../Structures/Schemas/settingsDB';

export default new Event('messageCreate', async (message: Message) => {
	const { guild, member, channel, author } = message;
	if (author.bot) return;
	const Data = await settings.findOne({ GuildID: guild?.id }); // settings database
	if (!Data) return;

	const linkWhitelist = [// links that will be aloud to be sent in a promo channel
		'https://twitch.tv/', 'twitch.tv/',
		'https://api.twitch.tv/', 'api.twitch.tv',
		'https://twitter.com/', 'twitter.com/',
		'https://instagram.com/', 'instagram.com/',
		'https://tiktok.com/', 'tiktok.com/',
		'https://github.com/', 'github.com/',
	];
	const logsChannel = guild?.channels.cache.get('959693430647308295');// Logs ChannelID 959693430647308295, remove Data.LoggingChannel if you dont have your logs channel saved in a db and replace it with 'Your Channel ID'
	let foundInText = false;

	const nowLive = guild?.channels.cache.get('959693430244642818'); // now-live 959693430244642818  ChannelID Data.PromotionChannel
	if (member?.permissions.has('ManageMessages') ? true : null) return;// if they have the manage messages permission ignore them
	/* havnt figure out the new permission system yet for dening the bot moderating messages */
	// if (channel.parentId === '694243745717288971' || channel.parentId === '959693430647308289') return; // ticket system not implemented yet

	for (const link in linkWhitelist) {
		if (message.content.toLowerCase().includes('https://overlay.expert') || message.content.toLowerCase().includes('overlay.expert')) return;
		if (message.content.toLowerCase().includes(linkWhitelist[link].toLowerCase())) { foundInText = true; }
		if (foundInText && message.channelId !== Data.PromotionChannel) { // NOW LIVE Channel ID
			try {
				const linkDetection = new EmbedBuilder()
					.setTitle('Link Detected')
					.setDescription(`:x: ${message.author} **Links should only be posted in ${nowLive}**`)
					.setColor(Colors.Red)
					.setFooter({ text: `${guild?.name}` })
					.setThumbnail(message.author.avatarURL({ size: 512 }))
					.setTimestamp();

				if (channel.id === '713791344803577868' || channel.id === '959693430647308292') return;// added these cause the bot was deleting messages in the moderator channel

				await message.reply({ embeds: [linkDetection] });
				message.delete().catch((e) => { console.error(e); });
				foundInText = false;

				const logsEmbed = new EmbedBuilder()
					.setTitle('Automated Message Deletion')
					.addFields([
						{
							name: 'User',
							value: `${message.author.username}`,
						},
						{
							name: 'Message',
							value: `${message.content}`,
						},
						{
							name: 'Channel',
							value: `${message.channel}`,
						},
					])
					.setColor(Colors.Purple)
					.setTimestamp();
				if (logsChannel?.type === ChannelType.GuildText) await logsChannel?.send({ embeds: [logsEmbed] });
				if (!foundInText) break;
			} catch (e) {
				console.error(e);
				return;
			}
		}
	}
});