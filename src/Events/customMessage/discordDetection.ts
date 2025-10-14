import { randomBytes } from 'crypto';
import { ChannelType, EmbedBuilder, Message } from 'discord.js';
import WarningDB from '../../Database/Schemas/WarnDB'; // Warning schema
import DB from '../../Database/Schemas/settingsDB';
import { Event } from '../../Structures/Event';

export default new Event<'messageCreate'>('messageCreate', async (message: Message) => {
	try {
		if (!message.guild) return;
		const { channel, author, guild } = message;
		let member = message.member;

		if (author.bot) return;

		// Exempt channels can be configured via environment or fall back to the legacy ID
		const EXEMPT_CHANNELS = (process.env.EXEMPT_CHANNELS || '959693430647308292').split(',').map((c) => c.trim());
		if (EXEMPT_CHANNELS.includes(channel.id)) return;

		// Don't moderate guild owner in prod
		if (!['dev', 'debug'].includes(process.env.Enviroment || '') && author.id === guild?.ownerId) return;

		// Load settings early
		const SettingsDB = await DB.findOne({ GuildID: guild.id });
		if (!SettingsDB) return;

		// Ensure we have a GuildMember object
		if (!member) {
			try {
				member = await guild.members.fetch(author.id).catch(() => null);
			} catch (fetchErr) {
				// Log fetch error and continue; member may remain undefined
				 
				console.warn('[discordDetection] failed to fetch member:', fetchErr);
			}
		}

		// Improved regex: don't accidentally capture trailing punctuation-only matches
		const discordInviteRegex = /(discord\.(?:gg|com|io|me|gift)\/\S+|discordapp\.com\/invite\/\S+)/i;
		const content = message.content || '';
		const isDiscordInvite = discordInviteRegex.test(content);

		if (!isDiscordInvite) return;

		// Build embed to DM / display
		const discordLinkDetection = new EmbedBuilder()
			.setTitle('Discord Link Detected')
			.setColor('Red')
			.setAuthor({ name: author.bot ? author.tag : (author.globalName || author.username || author.tag), iconURL: author.displayAvatarURL({ size: 512 }) })
			.setThumbnail(author.displayAvatarURL({ forceStatic: true, size: 512 }))
			.setFooter({ text: `guild: ${guild.name}` })
			.setTimestamp();

		// Fetch current warnings (read-only) to decide punishment level
		const existing = await WarningDB.findOne({ GuildID: guild.id, UserID: author.id }).lean();
		const warningCount = existing?.Warnings?.length ?? 0;
		console.log('[discordDetection] warningCount:', warningCount, 'user:', author.id);

		// Decide punishment and attempt operations safely
		let warningMessage = 'This is a warning for posting Discord invite links.';

		if (channel.type === ChannelType.GuildText) {
			switch (warningCount) {
				case 0:
					warningMessage = 'This is your first warning. Please do not post Discord links in this server.';
					break;
				case 1:
					warningMessage = 'Second warning: you will be timed out for 5 minutes.';
					if (member?.moderatable) {
						try {
							await member.timeout(5 * 60 * 1000, 'Posted Discord invite after warning');
						} catch (err) {
							console.error('[discordDetection] timeout failed:', err);
						}
					}
					break;
				case 2:
					warningMessage = 'Third warning: you will be kicked.';
					if (member?.kickable) {
						try {
							await member.kick('Posted Discord invite after multiple warnings');
						} catch (err) {
							console.error('[discordDetection] kick failed:', err);
						}
					}
					break;
				default:
					warningMessage = 'You have exceeded the maximum number of warnings and may be banned.';
					if (member?.bannable) {
						try {
							await member.ban({ reason: 'Repeatedly posting Discord invite links', deleteMessageSeconds: 5 });
						} catch (err) {
							console.error('[discordDetection] ban failed:', err);
						}
					}
					break;
			}

			// Create a new warning object and push to DB (upsert pattern)
			const newWarning = {
				WarningID: generateUniqueID(),
				Reason: 'Posting Discord Links',
				Source: 'bot',
				Date: new Date()
			};

			try {
				await WarningDB.updateOne(
					{ GuildID: guild.id, UserID: author.id },
					{ $push: { Warnings: newWarning } },
					{ upsert: true }
				);
			} catch (err) {
				console.error('[discordDetection] failed to update WarningDB:', err);
			}

			// Notify the user in-channel and attempt to DM
			try {
				await message.reply({ content: `${author}`, embeds: [discordLinkDetection.setDescription(warningMessage)] });
			} catch (err) {
				console.error('[discordDetection] failed to send channel reply:', err);
			}

			try {
				await message.delete();
			} catch (err) {
				console.error('[discordDetection] failed to delete message:', err);
			}

			try {
				await author.send({ embeds: [discordLinkDetection.setDescription(warningMessage)] });
			} catch (err) {
				console.error('[discordDetection] failed to DM user:', err);
			}
		}
	} catch (error) {
		console.error('[discordDetection] unexpected error:', error);
	}
});

// Function to generate a random unique ID
function generateUniqueID(): string { return randomBytes(8).toString('hex'); }