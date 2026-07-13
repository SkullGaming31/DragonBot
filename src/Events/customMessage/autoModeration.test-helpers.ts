import { Message } from 'discord.js';
import { randomBytes } from 'crypto';
import WarningDB from '../../Database/Schemas/WarnDB';
import { EmbedBuilder, GuildMember, Guild } from 'discord.js';
import { postPunishment, escalateByWarnings } from '../../Utilities/moderation';
import { info as logInfo, error as logError } from '../../Utilities/logger';

function generateUniqueID(): string {
  return randomBytes(8).toString('hex');
}

// The following exported helpers exist purely for testing edge branches that are
// difficult to reach from the full event flow (for example: synchronous throws
// that escape inner .catch handlers). They are not used by runtime code but
// make branch testing deterministic.
export async function __test_invokeInvite(message: Message, options?: { throwAt?: 'delete' | 'postPunishment' | 'authorSend' | 'channelSend' }) {
  const INVITE_FLAG = '__invite_handled';
  const guild = message.guild as Guild;
  const guildId = guild?.id ?? 'test-guild';
  // quick check similar to main handler
  if (!message || message.author?.bot) return;

  // simulate the early delete/send steps that live in the outer try
  try {
    if (options?.throwAt === 'delete') throw new Error('test-delete-throw');
    await (message.delete)?.().catch(() => null);

    if (options?.throwAt === 'channelSend') throw new Error('test-channel-send-throw');
    const ch = message.channel as unknown as { send?: unknown };
    if (typeof ch?.send === 'function') await (ch).send({ content: 'test' }).catch(() => null);

    // inner try block from the event
    try {
      const existingRaw = await WarningDB.findOne({ GuildID: guildId, UserID: message.author.id }).lean().catch(() => null);
      const existing = existingRaw as { Warnings?: unknown[] } | null;
      const warningCount = Array.isArray(existing?.Warnings) ? existing!.Warnings.length : 0;

      const member = (message.member ?? (await guild.members.fetch(message.author.id).catch(() => null))) as GuildMember | null;

      if (options?.throwAt === 'postPunishment') throw new Error('test-postPunishment-throw');
      await escalateByWarnings(member ?? null, guild, warningCount, 'Posted invite link');

      const newWarning = { WarningID: generateUniqueID(), Reason: 'Posting Discord Links', Source: 'bot', Date: new Date() };
      await WarningDB.updateOne({ GuildID: guildId, UserID: message.author.id }, { $push: { Warnings: newWarning } }, { upsert: true }).catch(() => null);

      (message as unknown as Record<string, unknown>)[INVITE_FLAG] = true;

      if (options?.throwAt === 'authorSend') throw new Error('test-author-send-throw');
      await message.author.send?.({ embeds: [] }).catch(() => null);
    } catch {
      // inner catch mirrors original: non-fatal
    }

    // postPunishment best-effort
    try {
      const embed = new EmbedBuilder().setTitle('Moderation Action').setDescription('test').setTimestamp();
      await postPunishment(guild, embed, []).catch(() => null);
    } catch { /* non-fatal */ }

    return;
  } catch (err) {
    // outer catch — replicate same logging as the module
    logError('autoModeration: error handling invite link', { error: (err as Error)?.message ?? err });
  }
}

export async function __test_invokeCaps(message: Message, options?: { throwAt?: 'delete' | 'postPunishment' | 'authorSend' | 'channelSend' }) {
  const guild = message.guild as Guild;
  const guildId = guild?.id ?? 'test-guild';
  try {
    if (options?.throwAt === 'delete') throw new Error('test-delete-throw-caps');
    await (message.delete)?.().catch(() => null);

    const ch = message.channel as unknown as { send?: unknown };
    if (options?.throwAt === 'channelSend') throw new Error('test-channel-send-throw-caps');
    if (typeof ch?.send === 'function') await (ch).send({ content: 'caps' }).catch(() => null);

    try {
      const existingRaw = await WarningDB.findOne({ GuildID: guildId, UserID: message.author.id }).lean().catch(() => null);
      const existing = existingRaw as { Warnings?: unknown[] } | null;
      const warningCount = Array.isArray(existing?.Warnings) ? existing!.Warnings.length : 0;
      const member = (message.member ?? (await guild.members.fetch(message.author.id).catch(() => null))) as GuildMember | null;
      if (options?.throwAt === 'postPunishment') throw new Error('test-postPunishment-throw-caps');
      await escalateByWarnings(member ?? null, guild, warningCount, 'Excessive capitalization');
      const newWarning = { WarningID: generateUniqueID(), Reason: 'Excessive capitalization', Source: 'bot', Date: new Date() };
      await WarningDB.updateOne({ GuildID: guildId, UserID: message.author.id }, { $push: { Warnings: newWarning } }, { upsert: true }).catch(() => null);
    } catch { /* non-fatal */ }

    try {
      const embed = new EmbedBuilder().setTitle('AutoMod Action').setDescription(`Deleted message by <@${message.author.id}>`).setTimestamp();
      await postPunishment(guild, embed, []).catch(() => null);
    } catch { /* non-fatal */ }

    return;
  } catch (err) {
    logError('autoModeration: error handling caps', { error: (err as Error)?.message ?? err });
  }
}

export async function __test_invokeSpam(messages: Message[], options?: { throwAt?: 'delete' | 'postPunishment' | 'authorSend' | 'channelSend' }) {
  // messages is an array of Message objects representing repeated posts from same user
  const message = messages[messages.length - 1];
  const guild = message.guild as Guild;
  const guildId = guild?.id ?? 'test-guild';
  try {
    if (options?.throwAt === 'delete') throw new Error('test-delete-throw-spam');
    await (message.delete)?.().catch(() => null);

    const ch = message.channel as unknown as { send?: unknown };
    if (options?.throwAt === 'channelSend') throw new Error('test-channel-send-throw-spam');
    if (typeof ch?.send === 'function') await (ch).send({ content: 'spam' }).catch(() => null);

    try {
      const existingRaw = await WarningDB.findOne({ GuildID: guildId, UserID: message.author.id }).lean().catch(() => null);
      const existing = existingRaw as { Warnings?: unknown[] } | null;
      const warningCount = Array.isArray(existing?.Warnings) ? existing!.Warnings.length : 0;
      const member = (message.member ?? (await guild.members.fetch(message.author.id).catch(() => null))) as GuildMember | null;
      if (options?.throwAt === 'postPunishment') throw new Error('test-postPunishment-throw-spam');
      await escalateByWarnings(member ?? null, guild, warningCount, 'Spam detected');
      const newWarning = { WarningID: generateUniqueID(), Reason: 'Spam', Source: 'bot', Date: new Date() };
      await WarningDB.updateOne({ GuildID: guildId, UserID: message.author.id }, { $push: { Warnings: newWarning } }, { upsert: true }).catch(() => null);
    } catch { /* non-fatal */ }

    try {
      const embed = new EmbedBuilder().setTitle('AutoMod Action').setDescription(`Deleted spam message(s) by <@${message.author.id}>`).setTimestamp();
      await postPunishment(guild, embed, []).catch(() => null);
    } catch { /* non-fatal */ }

    return;
  } catch (err) {
    logError('autoModeration: error handling spam', { error: (err as Error)?.message ?? err });
  }
}
