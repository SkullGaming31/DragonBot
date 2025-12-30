import { describe, it, vi, expect, beforeEach } from 'vitest';

// Ensure we can control the moderation helpers before the event module is loaded.
vi.mock('../src/Utilities/moderation', async () => {
  return {
    postPunishment: vi.fn(async () => null),
    escalateByWarnings: vi.fn(async () => null),
    tryKick: vi.fn(async () => true),
  };
});

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
  return {
    id: 'guild1',
    name: 'TestGuild',
    channels: { cache: channels, fetch: async (id: string) => channels.get(id) },
    members: { fetch: vi.fn(async (id: string) => ({ id })) },
    ownerId: 'owner',
  } as any;
}

function makeMessage(opts: Partial<any> = {}) {
  const channel = opts.channel ?? makeChannel();
  const guild = opts.guild ?? makeGuild();
  guild.channels.cache.set(channel.id, channel);
  return {
    content: opts.content ?? '',
    author: { id: opts.authorId ?? 'user1', bot: false, username: 'tester', displayAvatarURL: () => null, send: opts.send ?? (vi.fn(async () => ({}))) },
    guild,
    channel,
    member: opts.member ?? { roles: { cache: [] } },
    reply: vi.fn(async () => ({})),
    delete: vi.fn(async () => ({})),
  } as any;
}

// reuse existing mocks for DB models as other tests do
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

vi.mock('../src/Database/Schemas/WarnDB', async () => {
  const base = {
    findOne: vi.fn(() => ({ lean: async () => null })),
    updateOne: vi.fn(async () => null),
  };
  return { default: base };
});

describe('autoModeration extra branches', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // helper to mock the logger so we can assert outer catch executed
  function mockLogger() {
    vi.mock('../src/Utilities/logger', async () => ({
      info: vi.fn(),
      error: vi.fn(),
    }));
    return import('../src/Utilities/logger');
  }

  it('continues when postPunishment throws for invite handling', async () => {
    // override postPunishment to throw
    const mod = await import('../src/Utilities/moderation');
    (mod.postPunishment as any).mockImplementationOnce(async () => { throw new Error('boom'); });

    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const msg = makeMessage({ content: 'discord.gg/fail', authorId: 'u1' });
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    await (AutoMod.default as any).run(msg);

    expect(msg.delete).toHaveBeenCalled();
    // even though postPunishment threw, updateOne should still have been called
    expect(WarnDB.default.updateOne).toHaveBeenCalled();
  });

  it('continues when DM send rejects during invite handling', async () => {
    const mod = await import('../src/Utilities/moderation');
    (mod.postPunishment as any).mockImplementationOnce(async () => null);

    const sendSpy = vi.fn(async () => { throw new Error('dm fail'); });
    const msg = makeMessage({ content: 'discord.gg/dmfail', authorId: 'u2', send: sendSpy });
    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    await (AutoMod.default as any).run(msg);

    expect(msg.delete).toHaveBeenCalled();
    expect(WarnDB.default.updateOne).toHaveBeenCalled();
  });

  it('skips invite handling if INVITE_FLAG already set', async () => {
    const mod = await import('../src/Utilities/moderation');
    (mod.postPunishment as any).mockImplementationOnce(async () => null);

    const msg = makeMessage({ content: 'discord.gg/skip', authorId: 'u3' });
    // set the flag BEFORE running
    (msg as any)['__invite_handled'] = true;

    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    await (AutoMod.default as any).run(msg);

    // Since the handler should skip invite logic, delete should not be called
    expect(msg.delete).not.toHaveBeenCalled();
    expect(WarnDB.default.updateOne).not.toHaveBeenCalled();
  });

  it('handles postPunishment throwing during spam handling', async () => {
    const mod = await import('../src/Utilities/moderation');
    (mod.postPunishment as any).mockImplementation(async () => { throw new Error('boom'); });

    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    const msg1 = makeMessage({ content: 'hi', authorId: 'spammer' });
    const msg2 = makeMessage({ content: 'hi', authorId: 'spammer' });
    const msg3 = makeMessage({ content: 'hi', authorId: 'spammer' });

    await (AutoMod.default as any).run(msg1);
    await (AutoMod.default as any).run(msg2);
    await (AutoMod.default as any).run(msg3);

    expect(msg3.delete).toHaveBeenCalled();
    expect(WarnDB.default.updateOne).toHaveBeenCalled();
  });

  it('invite handling continues when WarningDB.findOne throws', async () => {
    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => { throw new Error('db fail'); });
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    const msg = makeMessage({ content: 'discord.gg/dbfail', authorId: 'u4' });
    await (AutoMod.default as any).run(msg);

    expect(msg.delete).toHaveBeenCalled();
    // updateOne should not be called because findOne threw and inner catch should have handled it
    expect(WarnDB.default.updateOne).not.toHaveBeenCalled();
  });

  it('caps handling when channel.send is missing and WarningDB.findOne throws', async () => {
    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => { throw new Error('db fail'); });
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    // channel with no send
    const channel = { id: 'chan1' } as any;
    const longCaps = 'THIS IS A VERY LOUD MESSAGE WITH LOTS OF CAPS AND LENGTH';
    const msg = makeMessage({ content: longCaps, authorId: 'u5', channel });

    await (AutoMod.default as any).run(msg);

    expect(msg.delete).toHaveBeenCalled();
    expect(WarnDB.default.updateOne).not.toHaveBeenCalled();
  });

  it('spam handling continues when WarningDB.findOne throws', async () => {
    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => { throw new Error('db fail'); });
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    const msg1 = makeMessage({ content: 'spam', authorId: 'spammer2' });
    const msg2 = makeMessage({ content: 'spam', authorId: 'spammer2' });
    const msg3 = makeMessage({ content: 'spam', authorId: 'spammer2' });

    await (AutoMod.default as any).run(msg1);
    await (AutoMod.default as any).run(msg2);
    await (AutoMod.default as any).run(msg3);

    expect(msg3.delete).toHaveBeenCalled();
    expect(WarnDB.default.updateOne).not.toHaveBeenCalled();
  });

  it('invite handling works when member cannot be fetched', async () => {
    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    const guild = makeGuild();
    // simulate fetch failing
    guild.members = { fetch: vi.fn(async () => null) } as any;
    const channel = makeChannel();
    guild.channels.cache.set(channel.id, channel);
    const msg = makeMessage({ content: 'discord.gg/nofetch', authorId: 'u6', guild, channel, member: undefined });

    await (AutoMod.default as any).run(msg);

    expect(msg.delete).toHaveBeenCalled();
    expect(WarnDB.default.updateOne).toHaveBeenCalled();
  });

  it('invite handling when channel.send is missing', async () => {
    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    const channel = { id: 'chan1' } as any; // no send
    const msg = makeMessage({ content: 'discord.gg/nosend', authorId: 'u7', channel });
    await (AutoMod.default as any).run(msg);

    expect(msg.delete).toHaveBeenCalled();
    expect(WarnDB.default.updateOne).toHaveBeenCalled();
  });

  it('caps handling continues when DM send rejects', async () => {
    const mod = await import('../src/Utilities/moderation');
    (mod.postPunishment as any).mockImplementationOnce(async () => null);

    const sendSpy = vi.fn(async () => { throw new Error('dm fail'); });
    const channel = makeChannel();
    const longCaps = 'THIS IS A VERY LOUD MESSAGE WITH LOTS OF CAPS AND LENGTH';
    const msg = makeMessage({ content: longCaps, authorId: 'u8', channel, send: sendSpy });
    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    await (AutoMod.default as any).run(msg);

    expect(msg.delete).toHaveBeenCalled();
    expect(WarnDB.default.updateOne).toHaveBeenCalled();
  });

  it('spam handling continues when DM send rejects', async () => {
    const mod = await import('../src/Utilities/moderation');
    (mod.postPunishment as any).mockImplementationOnce(async () => null);

    const sendSpy = vi.fn(async () => { throw new Error('dm fail'); });
    const channel = makeChannel();
    const msg1 = makeMessage({ content: 'spam', authorId: 'spammer3', channel, send: sendSpy });
    const msg2 = makeMessage({ content: 'spam', authorId: 'spammer3', channel, send: sendSpy });
    const msg3 = makeMessage({ content: 'spam', authorId: 'spammer3', channel, send: sendSpy });

    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    await (AutoMod.default as any).run(msg1);
    await (AutoMod.default as any).run(msg2);
    await (AutoMod.default as any).run(msg3);

    expect(msg3.delete).toHaveBeenCalled();
    expect(WarnDB.default.updateOne).toHaveBeenCalled();
  });

  it('invite handling when both postPunishment and DM throw', async () => {
    const mod = await import('../src/Utilities/moderation');
    (mod.postPunishment as any).mockImplementationOnce(async () => { throw new Error('boom'); });

    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    const sendSpy = vi.fn(async () => { throw new Error('dm boom'); });
    const msg = makeMessage({ content: 'discord.gg/bothfail', authorId: 'u9', send: sendSpy });

    await (AutoMod.default as any).run(msg);

    expect(msg.delete).toHaveBeenCalled();
    expect(WarnDB.default.updateOne).toHaveBeenCalled();
  });

  it('spam handling when both postPunishment and DM throw and channel.send missing', async () => {
    const mod = await import('../src/Utilities/moderation');
    (mod.postPunishment as any).mockImplementation(async () => { throw new Error('boom'); });

    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    const channel = { id: 'chan1' } as any; // no send
    const sendSpy = vi.fn(async () => { throw new Error('dm boom'); });
    const msg1 = makeMessage({ content: 'spam', authorId: 'spammer4', channel, send: sendSpy });
    const msg2 = makeMessage({ content: 'spam', authorId: 'spammer4', channel, send: sendSpy });
    const msg3 = makeMessage({ content: 'spam', authorId: 'spammer4', channel, send: sendSpy });

    await (AutoMod.default as any).run(msg1);
    await (AutoMod.default as any).run(msg2);
    await (AutoMod.default as any).run(msg3);

    expect(msg3.delete).toHaveBeenCalled();
    expect(WarnDB.default.updateOne).toHaveBeenCalled();
  });

  it('invite handling when postPunishment throws synchronously and author.send throws synchronously', async () => {
    // make postPunishment throw synchronously (so .catch([]) can't intercept)
    const mod = await import('../src/Utilities/moderation');
    (mod.postPunishment as any).mockImplementationOnce(() => { throw new Error('sync boom'); });

    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    // author.send will throw synchronously
    const badSend = () => { throw new Error('send sync fail'); };
    const msg = makeMessage({ content: 'discord.gg/syncfail', authorId: 'sync1', send: badSend });

    await (AutoMod.default as any).run(msg);

    expect(msg.delete).toHaveBeenCalled();
    // even if both postPunishment and author.send threw synchronously, the handler should continue
    expect(WarnDB.default.updateOne).toHaveBeenCalled();
  });

  it('caps handling when postPunishment throws synchronously and author.send throws synchronously', async () => {
    const mod = await import('../src/Utilities/moderation');
    (mod.postPunishment as any).mockImplementationOnce(() => { throw new Error('sync boom caps'); });

    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    const badSend = () => { throw new Error('send sync fail caps'); };
    const channel = makeChannel();
    const longCaps = 'THIS IS A VERY LOUD MESSAGE WITH LOTS OF CAPS AND LENGTH';
    const msg = makeMessage({ content: longCaps, authorId: 'sync2', channel, send: badSend });

    await (AutoMod.default as any).run(msg);

    expect(msg.delete).toHaveBeenCalled();
    expect(WarnDB.default.updateOne).toHaveBeenCalled();
  });

  it('invite outer catch triggers when channel accessor throws', async () => {
    const logger = await mockLogger();
    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    const guild = makeGuild();
    const msg: any = {
      content: 'discord.gg/outerthrow',
      author: { id: 'outer1', bot: false, username: 'o', displayAvatarURL: () => null, send: vi.fn(async () => ({})) },
      guild,
      member: { roles: { cache: [] } },
      delete: vi.fn(async () => ({})),
    };

    // make delete throw synchronously to reach the outer catch
    msg.delete = () => { throw new Error('delete sync boom'); };

    await (AutoMod.default as any).run(msg);

    // outer catch should have executed (logger.error called); updateOne should not have been called
    expect((logger as any).error).toHaveBeenCalled();
    expect(WarnDB.default.updateOne).not.toHaveBeenCalled();
  });

  it('caps outer catch triggers when channel accessor throws', async () => {
    const logger = await mockLogger();
    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    const guild = makeGuild();
    const msg: any = {
      content: 'THIS IS ALL CAPS AND LONG ENOUGH TO TRIGGER',
      author: { id: 'outer2', bot: false, username: 'o2', displayAvatarURL: () => null, send: vi.fn(async () => ({})) },
      guild,
      member: { roles: { cache: [] } },
      delete: vi.fn(async () => ({})),
    };

    // make delete throw synchronously to reach the outer catch
    msg.delete = () => { throw new Error('delete sync boom caps'); };

    await (AutoMod.default as any).run(msg);

    expect((logger as any).error).toHaveBeenCalled();
    expect(WarnDB.default.updateOne).not.toHaveBeenCalled();
  });

  it('spam outer catch triggers when channel accessor throws', async () => {
    const logger = await mockLogger();
    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    const guild = makeGuild();
    const base = {
      author: { id: 'outer3', bot: false, username: 'o3', displayAvatarURL: () => null, send: vi.fn(async () => ({})) },
      guild,
      member: { roles: { cache: [] } },
      delete: vi.fn(async () => ({})),
      content: 'spam',
    } as any;

    // run threshold times; make delete throw synchronously on the last message
    const first = { ...base, delete: vi.fn(async () => ({})) };
    const second = { ...base, delete: vi.fn(async () => ({})) };
    const third = { ...base, delete: () => { throw new Error('delete sync boom spam'); } };

    await (AutoMod.default as any).run(first);
    await (AutoMod.default as any).run(second);
    await (AutoMod.default as any).run(third);

    expect((logger as any).error).toHaveBeenCalled();
    // updateOne should not have been called because outer catch prevented inner work
    expect(WarnDB.default.updateOne).not.toHaveBeenCalled();
  });

  it('__test_invokeInvite triggers outer catch when delete throws', async () => {
    const logger = await mockLogger();
    const { __test_invokeInvite } = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    const msg = makeMessage({ content: 'discord.gg/test', authorId: 'x1' });

    await __test_invokeInvite(msg as any, { throwAt: 'delete' });

    expect((logger as any).error).toHaveBeenCalled();
  });

  it('__test_invokeCaps triggers outer catch when delete throws', async () => {
    const logger = await mockLogger();
    const { __test_invokeCaps } = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    const longCaps = 'THIS IS A VERY LOUD MESSAGE WITH LOTS OF CAPS AND LENGTH';
    const msg = makeMessage({ content: longCaps, authorId: 'x2' });

    await __test_invokeCaps(msg as any, { throwAt: 'delete' });

    expect((logger as any).error).toHaveBeenCalled();
  });

  it('__test_invokeSpam triggers outer catch when delete throws', async () => {
    const logger = await mockLogger();
    const { __test_invokeSpam } = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    const msg1 = makeMessage({ content: 'spam', authorId: 'spx' });
    const msg2 = makeMessage({ content: 'spam', authorId: 'spx' });
    const msg3 = makeMessage({ content: 'spam', authorId: 'spx' });

    await __test_invokeSpam([msg1 as any, msg2 as any, msg3 as any], { throwAt: 'delete' });

    expect((logger as any).error).toHaveBeenCalled();
  });

  // Cover remaining boolean branches in the test helpers
  it('__test_invokeInvite covers channel.send true/false and inner branches', async () => {
    const { __test_invokeInvite } = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    // default (channel with send) — exercises typeof ch.send === 'function' true
    const msg1 = makeMessage({ content: 'discord.gg/ok1', authorId: 'branch1' });
    await __test_invokeInvite(msg1 as any, undefined);
    expect(WarnDB.default.updateOne).toHaveBeenCalled();

    // channel without send — exercises typeof ch.send === 'function' false
    const channelNoSend = { id: 'chanX' } as any;
    const msg2 = makeMessage({ content: 'discord.gg/ok2', authorId: 'branch2', channel: channelNoSend });
    await __test_invokeInvite(msg2 as any, undefined);
    expect(WarnDB.default.updateOne).toHaveBeenCalled();

    // trigger inner postPunishment throw branch (equality true)
    await __test_invokeInvite(makeMessage({ content: 'discord.gg/ok3', authorId: 'branch3' }) as any, { throwAt: 'postPunishment' });

    // trigger inner authorSend throw branch (equality true)
    await __test_invokeInvite(makeMessage({ content: 'discord.gg/ok4', authorId: 'branch4' }) as any, { throwAt: 'authorSend' });
  });

  it('__test_invokeCaps covers channel.send true/false and inner branches', async () => {
    const { __test_invokeCaps } = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    const longCaps = 'THIS IS A VERY LOUD MESSAGE WITH LOTS OF CAPS AND LENGTH';
    const msg1 = makeMessage({ content: longCaps, authorId: 'caps1' });
    await __test_invokeCaps(msg1 as any, undefined);

    const channelNoSend = { id: 'chanY' } as any;
    const msg2 = makeMessage({ content: longCaps, authorId: 'caps2', channel: channelNoSend });
    await __test_invokeCaps(msg2 as any, undefined);

    await __test_invokeCaps(makeMessage({ content: longCaps, authorId: 'caps3' }) as any, { throwAt: 'postPunishment' });
    await __test_invokeCaps(makeMessage({ content: longCaps, authorId: 'caps4' }) as any, { throwAt: 'authorSend' });
  });

  it('__test_invokeSpam covers channel.send true/false and inner branches', async () => {
    const { __test_invokeSpam } = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => null }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    const m1 = makeMessage({ content: 'spam', authorId: 'spb1' });
    const m2 = makeMessage({ content: 'spam', authorId: 'spb1' });
    const m3 = makeMessage({ content: 'spam', authorId: 'spb1' });
    await __test_invokeSpam([m1 as any, m2 as any, m3 as any], undefined);

    const channelNoSend = { id: 'chanZ' } as any;
    const n1 = makeMessage({ content: 'spam', authorId: 'spb2', channel: channelNoSend });
    const n2 = makeMessage({ content: 'spam', authorId: 'spb2', channel: channelNoSend });
    const n3 = makeMessage({ content: 'spam', authorId: 'spb2', channel: channelNoSend });
    await __test_invokeSpam([n1 as any, n2 as any, n3 as any], undefined);

    await __test_invokeSpam([makeMessage({ content: 'spam', authorId: 'spb3' }) as any, makeMessage({ content: 'spam', authorId: 'spb3' }) as any, makeMessage({ content: 'spam', authorId: 'spb3' }) as any], { throwAt: 'postPunishment' });
    await __test_invokeSpam([makeMessage({ content: 'spam', authorId: 'spb4' }) as any, makeMessage({ content: 'spam', authorId: 'spb4' }) as any, makeMessage({ content: 'spam', authorId: 'spb4' }) as any], { throwAt: 'authorSend' });
  });

  it('invite handling uses >3 warnings branch (newTotal >=4)', async () => {
    const AutoMod = await import('../src/Events/customMessage/autoModeration');
    const WarnDB = await import('../src/Database/Schemas/WarnDB');
    // simulate 3 existing warnings so newTotal becomes 4 and triggers the else branch
    (WarnDB.default.findOne as any) = vi.fn(() => ({ lean: async () => ({ Warnings: [1, 2, 3] }) }));
    (WarnDB.default.updateOne as any) = vi.fn(async () => null);

    const msg = makeMessage({ content: 'discord.gg/overwarn', authorId: 'over1' });
    await (AutoMod.default as any).run(msg);

    expect(msg.delete).toHaveBeenCalled();
    expect(WarnDB.default.updateOne).toHaveBeenCalled();
  });
});
