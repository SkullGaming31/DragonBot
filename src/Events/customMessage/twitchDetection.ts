import { ChannelType, Colors, EmbedBuilder, Message } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
import settings from '../../Structures/Schemas/settingsDB';

const linkWhitelist: string[] = [
	'https://twitch.tv/',
	'twitch.tv/',
	'https://fb.gg/',
	'fb.gg/',
	'https://api.twitch.tv/',
	'api.twitch.tv',
	'https://twitter.com/',
	'twitter.com/',
	'https://instagram.com/',
	'instagram.com/',
	'https://tiktok.com/',
	'tiktok.com/',
	'https://github.com/',
	'github.com/',
];

export default new Event<'messageCreate'>('messageCreate', async (message: Message) => {
	const { guild, member, channel, author } = message;

	if (author.bot || !guild) return;

	const data = await settings.findOne({ GuildID: guild.id });

	if (!data || member?.permissions.has('ManageMessages') || !data.PromotionChannel) return;

	const nowLiveChannel = guild.channels.cache.get(data.PromotionChannel);
	if (!nowLiveChannel) return;

	const hasInvalidLink = linkWhitelist.some(async link => {
		const isInvalid = message.content.toLowerCase().includes(link.toLowerCase());
		if (isInvalid && message.channel.id !== data.PromotionChannel) {
			const linkDetection = new EmbedBuilder()
				.setTitle('Link Detected')
				.setDescription(`:x: ${message.author} **Links should only be posted in ${nowLiveChannel}**`)
				.setColor(Colors.Red)
				.setFooter({ text: guild.name })
				.setThumbnail(message.author.avatarURL({ size: 512 }))
				.setTimestamp();
      
			try {
				if (channel.type === ChannelType.GuildText) {
					await message.reply({ embeds: [linkDetection] });
				}
				await message.delete();
			} catch (e) {
				console.error(e);
			}
			return true;
		}
		return false;
	});

	if (hasInvalidLink) return;
});