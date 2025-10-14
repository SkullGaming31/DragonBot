import { Events, MessageReaction, User, TextChannel, EmbedBuilder, PartialMessageReaction, PartialUser } from 'discord.js';
import StarboardModel from '../../Database/Schemas/starboardDB';
import { Event } from '../../Structures/Event';

export default new Event<'messageReactionAdd'>('messageReactionAdd', async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
  try {
    // reaction.message may be partial
    const msg = reaction.message;
    // if the message is a partial, try to fetch the full message
    if ('partial' in msg && msg.partial && typeof (msg as any).fetch === 'function') {
      await (msg as any).fetch().catch(() => null);
    }
    if (!msg || !msg.guild) return;
    if ((user as User).bot) return; // ignore bot reactions
    // Prevent users from reacting to their own messages to inflate star counts
    if ((user as User).id && msg.author?.id && (user as User).id === msg.author.id) return;

    const guildId = msg.guild.id;
    const config = await StarboardModel.findOne({ guildId }).exec();
    if (!config) return;

    // if channel is ignored
    if (config.ignoredChannels.includes(msg.channel?.id ?? '')) return;

    // check emoji match (supports unicode or custom emoji string)
    const emojiKey = reaction.emoji.id ? reaction.emoji.id : reaction.emoji.name;
    if (emojiKey !== config.emoji) return;

    // fetch reaction count (fetch message if partial)
    const fetched = await (msg.reactions.cache.get(reaction.emoji.toString())?.fetch()?.catch(() => null));
    const count = (typeof reaction.count === 'number' ? reaction.count : (fetched ? fetched.count : 0));

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
      .setAuthor({ name: msg.author?.bot ? msg.author.tag : ((msg.author as any)?.globalName || msg.author?.username || msg.author?.tag || 'Unknown'), iconURL: msg.author?.displayAvatarURL() })
      .setTimestamp(msg.createdAt);

    // Only set description when there's non-empty content (EmbedBuilder rejects empty strings)
    const content = (msg.content ?? '').toString().trim();
    if (content.length > 0) embed.setDescription(content.slice(0, 2048));

    // Ensure footer channel name is non-empty
    const channelName = msg.channel && 'name' in msg.channel && msg.channel.name ? msg.channel.name : 'unknown';
    embed.setFooter({ text: `💫 ${count} | in #${channelName} • ${msg.id}` });

    if (msg.attachments.size > 0) {
      const first = msg.attachments.first();
      if (first && first.contentType?.startsWith('image')) embed.setImage(first.url);
    }

    if (post) {
      // update existing starboard message
      try {
        let starMsg = null;
        try {
          starMsg = await channel.messages.fetch(post.starboardMessageId);
        } catch {
          starMsg = null;
        }
        if (starMsg) {
          await starMsg.edit({ embeds: [embed] });
          post.count = count;
          await config.save();
        }
      } catch (err) {
        console.error('Failed to update starboard message:', err);
      }
    } else {
      // create new starboard post
      try {
        const sent = await channel.send({ embeds: [embed] });
        config.posts.push({ originalMessageId: msg.id, starboardMessageId: sent.id, count: count });
        await config.save();
      } catch (err) {
        console.error('Failed to send starboard message:', err);
      }
    }
  } catch (err) {
    console.error('Starboard reaction add handler error:', err);
  }
});
