
 
import { MessageReaction, User, TextChannel, EmbedBuilder, PartialMessageReaction, PartialUser } from 'discord.js';
import StarboardModel from '../../Database/Schemas/starboardDB';
import { Event } from '../../Structures/Event';
import { error as logError, info as logInfo } from '../../Utilities/logger';

// _args parameter names in some internal callsites are intentionally unused and typed for clarity

export default new Event<'messageReactionAdd'>('messageReactionAdd', async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
	try {
		// reaction.message may be partial
		const msg = reaction.message;
		// if the message is a partial, try to fetch the full message
		if ('partial' in msg && msg.partial) {
			const fetchFn = (msg as unknown as { fetch?: unknown })['fetch'];
			if (typeof fetchFn === 'function') {


				const _fetch = fetchFn as (..._args: unknown[]) => Promise<unknown>;
				await _fetch.call(msg).catch(() => null);
			}
		}
		if (!msg || !msg.guild) return;
		if ((user as User).bot) return; // ignore bot reactions
		// Prevent users from reacting to their own messages to inflate star counts
		if ((user as User).id && msg.author?.id && (user as User).id === msg.author.id) return;

		const guildId = msg.guild.id;
		let config;
		try {
			config = await StarboardModel.findOne({ guildId }).exec();
		} catch (err) {
			logError('messageReactionAdd: failed to read StarboardModel', { error: (err as Error)?.message ?? err });
			return;
		}
		if (!config) return;

		// if channel is ignored
		if (config.ignoredChannels.includes(msg.channel?.id ?? '')) return;

		// check emoji match (supports unicode or custom emoji string)
		const emojiKey = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
		if (emojiKey !== config.emoji) return;

		// fetch reaction count (fetch message if partial)
		const reactionEntry = msg.reactions.cache.get(reaction.emoji.toString());

		const fetched = reactionEntry && typeof (reactionEntry as unknown as { fetch?: unknown })['fetch'] === 'function'



			? await ((reactionEntry as unknown as { fetch: (..._args: unknown[]) => Promise<unknown> }).fetch().catch(() => null)) as unknown as { count?: number }
			: null;
		const count = (typeof reaction.count === 'number' ? reaction.count : (fetched && typeof fetched.count === 'number' ? fetched.count : 0));

		const threshold = config.threshold ?? 3;
		if (count < threshold) return;

		// find existing post mapping
		const post = config.posts.find(p => p.originalMessageId === msg.id);

		const starChannelId = config.channelId;
		if (!starChannelId) return; // no destination configured

		const guild = msg.guild;
		if (!guild) return;
		const channel = guild.channels.cache.get(starChannelId) as TextChannel | undefined;
		if (!channel) return;

		// build embed
		const embed = new EmbedBuilder()
			.setAuthor({ name: msg.author?.bot ? msg.author.tag : (((msg.author as unknown as { globalName?: string })?.globalName) || (msg.author as unknown as { username?: string })?.username || msg.author?.tag || 'Unknown'), iconURL: msg.author?.displayAvatarURL() })
			.setTimestamp(msg.createdAt);

		// Only set description when there's non-empty content (EmbedBuilder rejects empty strings)
		const content = (msg.content ?? '').toString().trim();
		if (content.length > 0) embed.setDescription(content.slice(0, 2048));

		// Ensure footer channel name is non-empty
		const channelName = msg.channel && 'name' in msg.channel && msg.channel.name ? msg.channel.name : 'unknown';
		embed.setFooter({ text: `\ud83d\udcab ${count} | in #${channelName} \u2022 ${msg.id}` });

		if (msg.attachments.size > 0) {
			const first = msg.attachments.first();
			if (first && first.contentType?.startsWith('image')) embed.setImage(first.url);
		}

		if (post) {
			// update existing starboard message
			try {
				let starMsg = null;
				try {
					starMsg = await channel.messages.fetch(post.starboardMessageId).catch(() => null);
				} catch (err) {
					logError('messageReactionAdd: Error fetching starboard message', { error: (err as Error)?.message ?? err });
					starMsg = null;
				}
				if (starMsg) {
					await starMsg.edit({ embeds: [embed] });
					post.count = count;
					await config.save();
					logInfo('messageReactionAdd: updated starboard message', { guildId, messageId: msg.id, count });
				}
			} catch (err) {
				logError('messageReactionAdd: Failed to update starboard message', { error: (err as Error)?.message ?? err });
			}
		} else {
			// create new starboard post
			try {
				const sent = await channel.send({ embeds: [embed] });
				config.posts.push({ originalMessageId: msg.id, starboardMessageId: sent.id, count: count });
				await config.save();
				logInfo('messageReactionAdd: created starboard message', { guildId, messageId: msg.id, count });
			} catch (err) {
				logError('messageReactionAdd: Failed to send starboard message', { error: (err as Error)?.message ?? err });
			}
		}
	} catch (err) {
		logError('Starboard reaction add handler error', { error: (err as Error)?.message ?? err });
	}
});
