import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import AutoModEvent from '../src/Events/customMessage/autoModeration';

// Mocks for discord.js objects
function makeChannel() {
  const sent: any[] = [];
  return {
    id: 'chan1',
    type: 0,
    send: vi.fn(async (payload: any) => {
      sent.push(payload);
      return {};
    }),
    __sent: sent,
  } as any;
}

function makeGuild() {
  const channels = new Map();
  const add = (ch: any) => channels.set(ch.id, ch);
  return {
    id: 'guild1',
    name: 'TestGuild',
    channels: { cache: channels, fetch: async (id: string) => channels.get(id) },
    members: { fetch: vi.fn(async (id: string) => ({ id })) },
    ownerId: 'owner',
    add,
  } as any;
}

function makeMessage(opts: Partial<any> = {}) {
  const channel = opts.channel ?? makeChannel();
  const guild = opts.guild ?? makeGuild();
  if (opts.channel && opts.guild) {
    guild.channels.cache.set(channel.id, channel);
  } else {
    guild.channels.cache.set(channel.id, channel);
  }
  return {
    content: opts.content ?? '',
    author: { id: opts.authorId ?? 'user1', bot: false, username: 'tester', displayAvatarURL: () => null },
    guild,
    channel,
    member: opts.member ?? { roles: { cache: [] } },
    reply: vi.fn(async () => ({})),
    delete: vi.fn(async () => ({})),
  } as any;
}

// Mock DB models. Provide a `findOne(...).lean()` chain shape used by the code.
vi.mock('../src/Database/Schemas/autoMod', async () => {
  const data = { enabled: true, rules: { inviteLinks: { enabled: true }, caps: { enabled: true, threshold: 50 }, spam: { enabled: true, threshold: 3 } } };
  return {
    default: {
      findOne: vi.fn(() => ({ lean: async () => data })),
    },
  };
});

vi.mock('../src/Database/Schemas/settingsDB', async () => {
  const data = { GuildID: 'guild1', punishmentChannel: 'chan1' };
  return {
    default: {
      findOne: vi.fn(() => ({ lean: async () => data })),
    },
  };
});

// Mock WarningDB used by autoModeration for upserting warnings
vi.mock('../src/Database/Schemas/WarnDB', async () => {
  const base = {
    findOne: vi.fn(() => ({ lean: async () => null })),
    updateOne: vi.fn(async () => null),
  };
  return { default: base };
});

describe('autoModeration event', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('deletes invite links and posts to punishment channel', async () => {
    const msg = makeMessage({ content: 'Join my server discord.gg/abc123', authorId: 'user1' });
    // ensure WarnDB returns no existing warnings
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    // run handler
    await AutoModEvent.run(msg);

    expect(msg.delete).toHaveBeenCalled();
    // punishment channel send called
    const ch = msg.guild.channels.cache.get('chan1');
    expect(ch.send).toHaveBeenCalled();
    expect(WarnDB.default.updateOne).toHaveBeenCalled();
  });

  it('deletes excessive caps messages', async () => {
    const text = 'THIS IS A VERY LOUD MESSAGE WITH LOTS OF CAPS';
    const msg = makeMessage({ content: text, authorId: 'user2' });
    await AutoModEvent.run(msg);
    expect(msg.delete).toHaveBeenCalled();
    const ch = msg.guild.channels.cache.get('chan1');
    expect(ch.send).toHaveBeenCalled();
  });

  it('detects spam and deletes after threshold', async () => {
    const msg1 = makeMessage({ content: 'hi', authorId: 'spammer' });
    const msg2 = makeMessage({ content: 'hi', authorId: 'spammer' });
    const msg3 = makeMessage({ content: 'hi', authorId: 'spammer' });

    await AutoModEvent.run(msg1);
    await AutoModEvent.run(msg2);
    await AutoModEvent.run(msg3);

    // last message should be deleted and punishment posted
    expect(msg3.delete).toHaveBeenCalled();
    const ch = msg3.guild.channels.cache.get('chan1');
    expect(ch.send).toHaveBeenCalled();
  });

  it('escalates to kick on second warning', async () => {
    const member = { id: 'victim', kickable: true, kick: vi.fn(async () => ({})), roles: { cache: [] } } as any;
    const msg = makeMessage({ content: 'discord.gg/shouldkick', authorId: 'victim', member });

    // Make WarnDB report 1 existing warning so newCount becomes 2
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => ({ Warnings: [{ WarningID: 'a' }, { WarningID: 'b' }] }) }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    await AutoModEvent.run(msg);

    // Expect kick attempted
    expect(member.kick).toHaveBeenCalled();
    // Punishment message should be posted
    const ch = msg.guild.channels.cache.get('chan1');
    expect(ch.send).toHaveBeenCalled();
    expect(WarnDB.default.updateOne).toHaveBeenCalled();
  });
});
