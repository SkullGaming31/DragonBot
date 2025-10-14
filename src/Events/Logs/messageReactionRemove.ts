 
import { MessageReaction, User, TextChannel, EmbedBuilder, PartialMessageReaction, PartialUser } from 'discord.js';
import StarboardModel from '../../Database/Schemas/starboardDB';
import { Event } from '../../Structures/Event';

export default new Event<'messageReactionRemove'>('messageReactionRemove', async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
	try {
		const msg = reaction.message;
		// fetch full message when partial
		if ('partial' in msg && msg.partial) {
			const fetchFn = (msg as unknown as { fetch?: unknown })['fetch'];
			if (typeof fetchFn === 'function') {

				const _fetch = fetchFn as (..._args: unknown[]) => Promise<unknown>;
				await _fetch.call(msg).catch(() => null);
			}
		}
		if (!msg || !msg.guild) return;
		if ((user as User).bot) return;
		// Ignore removals made by the message author (they shouldn't be able to self-star)
		if ((user as User).id && msg.author?.id && (user as User).id === msg.author.id) return;

		const guildId = msg.guild.id;
		const config = await StarboardModel.findOne({ guildId }).exec();
		if (!config) return;

		// if channel is ignored
		if (config.ignoredChannels.includes(msg.channel?.id ?? '')) return;

		const emojiKey = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
		if (emojiKey !== config.emoji) return;

		// fetch current reaction count
		const reactionEntry = msg.reactions.cache.get(reaction.emoji.toString());
		const fetched = reactionEntry && typeof (reactionEntry as unknown as { fetch?: unknown })['fetch'] === 'function'


			? await ((reactionEntry as unknown as { fetch: (..._args: unknown[]) => Promise<unknown> }).fetch().catch(() => null)) as unknown as { count?: number }
			: null;
		const count = (typeof reaction.count === 'number' ? reaction.count : (fetched && typeof fetched.count === 'number' ? fetched.count : 0));

		const threshold = config.threshold ?? 3;

		// find mapping
		const postIndex = config.posts.findIndex(p => p.originalMessageId === msg.id);
		if (postIndex === -1) return; // nothing to update

		const mapping = config.posts[postIndex];
		if (!mapping) return;

		const starChannelId = config.channelId;
		if (!starChannelId) return;

		const guild = msg.guild;
		const channel = guild.channels.cache.get(starChannelId) as TextChannel | undefined;
		if (!channel) return;

		// if still at/above threshold, update embed count
		if (count >= threshold) {
			try {
				const starMsg = await channel.messages.fetch(mapping.starboardMessageId).catch(() => null);
				if (starMsg) {
					const embed = new EmbedBuilder()
						.setAuthor({ name: msg.author?.bot ? msg.author.tag : (((msg.author as unknown as { globalName?: string })?.globalName) || (msg.author as unknown as { username?: string })?.username || msg.author?.tag || 'Unknown'), iconURL: msg.author?.displayAvatarURL() })
						.setTimestamp(msg.createdAt);

					const content = (msg.content ?? '').toString().trim();
					if (content.length > 0) embed.setDescription(content.slice(0, 2048));
					const channelName = msg.channel && 'name' in msg.channel && msg.channel.name ? msg.channel.name : 'unknown';
					embed.setFooter({ text: `💫 ${count} | in #${channelName} • ${msg.id}` });
					if (msg.attachments.size > 0) {
						const first = msg.attachments.first();
						if (first && first.contentType?.startsWith('image')) embed.setImage(first.url);
					}

					await starMsg.edit({ embeds: [embed] });
					mapping.count = count;
					await config.save();
				}
			} catch (err) {
				console.error('Failed to update starboard message on reaction remove:', err);
			}
			return;
		}

		// count dropped below threshold -> delete starboard post and remove mapping
		try {
			let starMsg = null;
			try {
				starMsg = await channel.messages.fetch(mapping.starboardMessageId).catch(() => null);
			} catch (err) {
				console.error('Error fetching starboard message for delete:', err);
				starMsg = null;
			}
			if (starMsg) {
				try { await starMsg.delete(); } catch (delErr) { console.warn('Failed to delete starboard message:', delErr); }
			}
			// remove mapping
			config.posts.splice(postIndex, 1);
			await config.save();
		} catch (err) {
			console.error('Failed to remove starboard post when reactions dropped:', err);
		}
	} catch (err) {
		console.error('Starboard reaction remove handler error:', err);
	}
});
