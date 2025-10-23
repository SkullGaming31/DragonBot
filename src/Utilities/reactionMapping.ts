import { EmbedBuilder, Guild, TextChannel } from 'discord.js';
import ReactionRoleModel from '../Database/Schemas/reactionRole';
import { tryReact } from './retry';
import { info } from './logger';

export interface CreateMappingOpts {
  guild: Guild;
  guildId: string;
  channel: TextChannel;
  messageId: string;
  messageLike?: unknown;
  emoji: string;
  roleId: string;
  label?: string;
  actorId?: string;
}

/**
 * Create a reaction-role mapping, try to react (best-effort), and send an audit embed if configured.
 * Returns the created document.
 */
export async function createAndLogMapping(opts: CreateMappingOpts) {
  const { guild, guildId, channel, messageId, messageLike, emoji, roleId, label, actorId } = opts;

  const existing = await ReactionRoleModel.findOne({ guildId, messageId, emoji, roleId });
  if (existing) return { existing: true, doc: existing };

  const doc = await ReactionRoleModel.create({ guildId, channelId: channel.id, messageId, emoji, roleId, label });

  // react to message to ensure emoji is present (best-effort)
  let reactResult: 'ok' | 'missing_permissions' | 'failed' = 'failed';
  try {
    if (messageLike && typeof (messageLike as any).react === 'function') {
      reactResult = await tryReact(messageLike, emoji).catch(() => 'failed');
    } else {
      try {
        const msg = await channel.messages.fetch(messageId).catch(() => undefined);
        if (msg) reactResult = await tryReact(msg as unknown, emoji).catch(() => 'failed');
      } catch {
        // ignore
      }
    }
  } catch (err) {
    // ignore reaction errors
  }

  // optional: log creation to configured logs channel (best-effort; don't block caller)
  (async () => {
    try {
      const { sendGuildLog } = await import('./audit');
      const embed = new EmbedBuilder()
        .setTitle('Reaction Role Mapping Created')
        .setDescription(`Mapping ID: \`${doc._id}\` by <@${actorId ?? 'unknown'}>`)
        .addFields([
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Message ID', value: messageId, inline: true },
          { name: 'Emoji', value: emoji, inline: true },
          { name: 'Role', value: `<@&${roleId}>`, inline: true },
        ])
        .setTimestamp();

      await sendGuildLog(guild, embed, channel.id).catch(() => null);
      info('reactionMapping: sent audit log', { guildId: guild.id, mappingId: String(doc._id) });
    } catch (err) {
      // swallow - best-effort logging
    }
  })();

  return { existing: false, doc, reactResult } as const;
}

export default { createAndLogMapping };
