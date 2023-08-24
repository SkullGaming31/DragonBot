import { ChannelType, Colors, EmbedBuilder, Message } from 'discord.js';
import { Event } from '../../../src/Structures/Event';
import settings from '../../Database/Schemas/settingsDB';

const linkWhitelist: RegExp[] = [
	/^(https?:\/\/)?(www\.)?twitch\.tv\//i,
	/^(https?:\/\/)?(www\.)?fb\.gg\//i,
	/^(https?:\/\/)?(www\.)?api\.twitch\.tv\//i,
	/^(https?:\/\/)?(www\.)?twitter\.com\//i,
	/^(https?:\/\/)?(www\.)?instagram\.com\//i,
	/^(https?:\/\/)?(www\.)?tiktok\.com\//i,
	/^(https?:\/\/)?(www\.)?github\.com\//i,
];

const linkCooldowns = new Map<string, number>(); // Map<User ID, Link Count>

export default new Event<'messageCreate'>('messageCreate', async (message: Message) => {
	const { guild, channel, author, content } = message;

	if (author.bot || !guild) return;

	const data = await settings.findOne({ GuildID: guild.id });

	if (!data) return;

	const promotionChannelId = data.PromotionChannel;
	if (!promotionChannelId) return;

	const nowLiveChannel = guild.channels.cache.get(promotionChannelId);
	if (!nowLiveChannel) return;

	if (channel.id !== promotionChannelId && content.includes('https')) {
		const hasInvalidLink = linkWhitelist.some((pattern) => {
			if (!pattern.test(content)) {
				const isWhitelisted = /^(overlay\.expert|https:\/\/overlay\.expert)/i.test(content);

				if (!isWhitelisted) {
					const linkDetection = new EmbedBuilder()
						.setTitle('Link Detected')
						.setDescription(`:x: ${author} **Links should only be posted in ${nowLiveChannel}**`)
						.setColor(Colors.Red)
						.setFooter({ text: guild.name })
						.setThumbnail(author.avatarURL({ size: 512 }))
						.setTimestamp();

					try {
						if (channel.type === ChannelType.GuildText) {
							const userLinkCount = (linkCooldowns.get(author.id) || 0) + 1;
							linkCooldowns.set(author.id, userLinkCount);

							message.reply({ embeds: [linkDetection] })
								.then(() => {
									if (userLinkCount >= 3) {
										const member = guild.members.cache.get(author.id);
										if (member) {
											const punishmentChannel = guild.channels.cache.get(data.punishmentChannel ?? '');
											const defaultPunishmentChannel = guild.channels.cache.get('959693430647308295');

											if (punishmentChannel && punishmentChannel.type === ChannelType.GuildText) {
												const punishmentMessage = new EmbedBuilder()
													.setTitle('Link Spam Detected')
													.setDescription(`:x: ${author} has been kicked for posting too many links.`)
													.setColor(Colors.Red)
													.setFooter({ text: guild.name })
													.setThumbnail(author.avatarURL({ size: 512 }))
													.setTimestamp();

												punishmentChannel.send({ embeds: [punishmentMessage] })
													.then(() => member.kick('Link spam'))
													.catch((error) => console.error(error));
											} else if (defaultPunishmentChannel && defaultPunishmentChannel.type === ChannelType.GuildText) {
												const punishmentMessage = new EmbedBuilder()
													.setTitle('Link Spam Detected')
													.setDescription(`:x: ${author} has been kicked for posting too many links.`)
													.setColor(Colors.Red)
													.setFooter({ text: guild.name })
													.setThumbnail(author.avatarURL({ size: 512 }))
													.setTimestamp();

												defaultPunishmentChannel.send({ embeds: [punishmentMessage] })
													.then(() => member.kick('Link spam'))
													.catch((error) => console.error(error));
											}
										}
									}
									message.delete().catch((error) => console.error(error));
								})
								.catch((error) => console.error(error));
						} else {
							message.delete().catch((error) => console.error(error));
						}
					} catch (error) {
						console.error(error);
					}

					return true;
				}
			}

			return false;
		});

		if (hasInvalidLink) return;
	}

	if (linkCooldowns.has(author.id)) {
		const lastLinkTime = linkCooldowns.get(author.id) || 0;
		const currentTime = Date.now();

		if (currentTime - lastLinkTime >= 1800000) {
			linkCooldowns.delete(author.id);
		}
	}
});