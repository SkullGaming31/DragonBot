import { ChannelType, EmbedBuilder, Message } from 'discord.js';
import settings from '../../Database/Schemas/settingsDB';
import { Event } from '../../Structures/Event';

// Link whitelist using an object
type LinkPattern = RegExp;

const linkWhitelist: { [domain: string]: LinkPattern } = {
	// Existing allowed links
	'twitch.tv': /^(https?:\/\/)?(www\.)?twitch\.tv\//i,
	'fb.gg': /^(https?:\/\/)?(www\.)?fb\.gg\//i,
	'api.twitch.tv': /^(https?:\/\/)?(www\.)?api\.twitch\.tv\//i,

	// New allowed links
	'twitter.com': /^(https?:\/\/)?(www\.)?twitter\.com\//i,
	'x.com': /^(https?:\/\/)?(www\.)?x\.com\//i,
	'instagram.com': /^(https?:\/\/)?(www\.)?instagram\.com\//i,
	'tiktok.com': /^(https?:\/\/)?(www\.)?tiktok\.com\//i,
	'github.com': /^(https?:\/\/)?(www\.)?github\.com\//i,
	'kick.com': /^(https?:\/\/)?(www\.)?kick\.com\//i,
};

// Cooldown map for link posting frequency
const linkCooldowns = new Map<string, number>();

export default new Event<'messageCreate'>('messageCreate', async (message: Message) => {
	// Destructure message properties for convenience
	const { guild, channel, author, content, member } = message;

	// Ignore bot messages and messages outside guilds
	if (author.bot || !guild) return;

	// Fetch guild settings from database
	const settingsData = await settings.findOne({ GuildID: guild.id });
	if (!settingsData) return;

	// Extract promotion and punishment channel IDs
	const promotionChannelId = settingsData.PromotionChannel;
	const punishmentChannelId = settingsData.punishmentChannel ?? '';

	// Skip processing if not in the promotion channel or message doesn't contain a link
	if (channel.id !== promotionChannelId || !content.includes('https')) return;

	// Check if author is moderator, admin, or guild owner
	const isModeratorOrAdmin = member?.permissions.has('Administrator') || member?.roles.cache.some((role) => role.name === 'Moderator' || role.name === 'Admin');
	if (guild.ownerId === author.id || isModeratorOrAdmin) return;

	// Function to check if a link is allowed
	const isLinkAllowed = (url: string) => {
		const domain = new URL(url).hostname;
		return !!linkWhitelist[domain]; // Check if domain exists as a key in the object
	};

	// Function to handle invalid link detection
	const handleInvalidLink = async () => {
		const linkDetectionEmbed = new EmbedBuilder()
			.setTitle('Link Detected')
			.setDescription(`:x: ${author.username} **Links are only allowed in ${guild.channels.cache.get(promotionChannelId)?.toString()}**`)
			.setColor('Red')
			.setFooter({ text: guild.name })
			.setThumbnail(author.avatarURL({ size: 512 }))
			.setTimestamp();

		try {
			// Send warning embed
			await message.reply({ embeds: [linkDetectionEmbed] });

			// Track link posting for the user
			const userLinkCount = (linkCooldowns.get(author.id) || 0) + 1;
			linkCooldowns.set(author.id, userLinkCount);

			// Check for cooldown and take action if exceeded
			if (userLinkCount >= 3) {
				const kickMember = guild.members.cache.get(author.id);

				if (kickMember) {
					const punishmentChannel = guild.channels.cache.get(punishmentChannelId);
					const defaultPunishmentChannel = guild.channels.cache.get('959693430647308295');

					const punishmentEmbed = new EmbedBuilder()
						.setTitle('Discord Event[LINK SPAM]')
						.setDescription(`:x: ${author.username} has been kicked for posting too many links.`)
						.setColor('Red')
						.setFooter({ text: guild.name })
						.setThumbnail(author.avatarURL({ size: 512 }))
						.setTimestamp();

					// Try kicking the user in the punishment channel or default channel
					if (punishmentChannel && punishmentChannel.type === ChannelType.GuildText) {
						await punishmentChannel.send({ embeds: [punishmentEmbed] }).then(() => kickMember.kick('Link spam'));
					} else if (defaultPunishmentChannel && defaultPunishmentChannel.type === ChannelType.GuildText) {
						await defaultPunishmentChannel.send({ embeds: [punishmentEmbed] }).then(() => kickMember.kick('Link spam'));
					} else {
						console.warn('No suitable channel found for punishment messages.');
					}
				}

				// Delete the message if in a text channel
				if (channel.type === ChannelType.GuildText) {
					await message.delete().catch((error) => console.error(error));
				}
			}
		} catch (error) {
			console.error(error);
		}
	};

	// Check if the link is allowed using the helper function
	if (!isLinkAllowed(content)) {
		await handleInvalidLink();
	}

	// Cooldown management
	if (linkCooldowns.has(author.id)) {
		const lastLinkTime = linkCooldowns.get(author.id) || 0;
		const currentTime = Date.now();

		if (currentTime - lastLinkTime >= 1800000) {
			linkCooldowns.delete(author.id);
		}
	}
});