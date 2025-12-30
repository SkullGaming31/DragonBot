import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Message, userMention } from 'discord.js';
import { Event } from '../../Structures/Event';
import { info as logInfo, error as logError } from '../../Utilities/logger';

/**
 * Improved bot-mention responder.
 * - Uses runtime client user id
 * - Ignores other bots and @everyone mentions
 * - Uses safe try/catch for reply and deletion
 * - TTL configurable via BOT_MENTION_TTL_MS (ms)
 */

// Track scheduled deletion timers for replies; WeakMap lets timers be GC'd with messages
const scheduled = new WeakMap<Message, ReturnType<typeof setTimeout>>();

export default new Event<'messageCreate'>('messageCreate', async (message: Message) => {
	const { author, guild, client } = message;

	// Only operate in guilds
	if (!guild) return;

	// Ignore messages from any bot
	if (author.bot) return;

	// Ignore @everyone / @here
	if (message.mentions.everyone) return;

	// Ensure client user is available
	const clientUserId = client?.user?.id;
	if (!clientUserId) return;

	// Only respond when the bot is actually mentioned (use mentions API)
	if (!message.mentions.users.has(clientUserId)) return;

	const displayName = message.member?.displayName ?? author.globalName ?? author.username;

	const embed = new EmbedBuilder()
		.setColor('Green')
		.setDescription(
			`Hi ${displayName}, how can I help you out today? Leave a brief description of what your issue is, and someone will get to you as soon as they are free.`
		)
		.setThumbnail(author.displayAvatarURL({ size: 512 }))
		.setFooter({ text: guild.name });

	// Use runtime client id for oauth link; fall back to BOT_CLIENT_ID env var if provided.
	const clientId = clientUserId ?? process.env.BOT_CLIENT_ID;
	if (!clientId) {
		// nothing sensible to link to — bail out early
		logInfo('botMention: no client id available, skipping mention reply', { guild: guild.id });
		return;
	}

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL('https://github.com/SkullGaming31/skullgaming31')
			.setLabel('SkullGaming31\'s Github'),
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL(`https://discord.com/oauth2/authorize?client_id=${clientId}`)
			.setLabel('Add Me to your Discord Server'),
		new ButtonBuilder()
			.setStyle(ButtonStyle.Link)
			.setURL('https://twitch.tv/skullgaminghq')
			.setLabel('skullgaminghq\'s Twitch')
	);

	// TTL (ms) configurable via env; default 30s in dev, 5m in prod
	const parsed = Number.parseInt(String(process.env.BOT_MENTION_TTL_MS ?? ''), 10);
	const defaultTtl = process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug' ? 30_000 : 300_000;
	const ttl = Number.isFinite(parsed) && parsed > 0 ? parsed : defaultTtl;

	let replyMsg: Message | null = null;
	try {
		replyMsg = await message.reply({
			content: `${userMention(author.id)}, this message will delete in ${Math.round(ttl / 1000)}s`,
			embeds: [embed],
			components: [row],
		});
	} catch (err) {
		// non-fatal
		logError('botMention: failed to send reply', { error: (err as Error)?.message ?? err });
		return;
	}

	// Schedule deletion of the reply (best-effort). Store timer in WeakMap so it doesn't leak.
	try {
		const timer = setTimeout(async () => {
			try {
				if (!replyMsg) return;
				if (replyMsg.thread?.isThread()) {
					await replyMsg.thread.delete('time elapsed').catch(() => null);
				}
				await replyMsg.delete().catch(() => null);
			} catch (err) {
				logError('botMention: failed to delete reply', { error: (err as Error)?.message ?? err });
			}
		}, ttl);
		scheduled.set(replyMsg, timer);
	} catch (err) {
		logError('botMention: failed to schedule deletion', { error: (err as Error)?.message ?? err });
	}
});