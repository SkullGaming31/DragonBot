import { describe, it, expect, vi, beforeEach } from 'vitest';
import StarboardModel from '../src/Database/Schemas/starboardDB';
import addHandler from '../src/Events/Logs/messageReactionAdd';
import removeHandler from '../src/Events/Logs/messageReactionRemove';

// We will mock the StarboardModel and minimal Discord message/reaction objects
vi.mock('../src/Database/Schemas/starboardDB', () => ({
  default: {
    findOne: vi.fn(),
  }
}));

// Helper to create a fake message and reaction
function createFakeReaction({ guildId = 'G1', channelId = 'C1', messageId = 'M1', emoji = '⭐', count = 3 } = {}) {
  const message = {
    id: messageId,
    guild: { id: guildId, channels: { cache: new Map() } },
    channel: { id: channelId, name: 'general' },
    content: 'Hello world',
    createdAt: new Date(),
    author: { tag: 'User#0001', displayAvatarURL: () => null },
    attachments: new Map(),
    reactions: { cache: new Map() }
  } as any;

  const reaction = {
    emoji: { id: null, name: emoji, toString: () => emoji },
    message,
    count
  } as any;

  return { reaction, message };
}

describe('Starboard handlers (unit tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds a starboard post when threshold is reached', async () => {
    const { reaction, message } = createFakeReaction({ count: 3 });

    // Mock config
    const saveMock = vi.fn();
    const fakeConfig: any = {
      guildId: 'G1',
      channelId: 'STAR',
      emoji: '⭐',
      threshold: 3,
      ignoredChannels: [],
      posts: [],
      save: saveMock
    };

    (StarboardModel.findOne as any).mockImplementation(() => ({ exec: async () => fakeConfig }));

    // Mock channel send
    const sent = { id: 'S1' };
    const channelMock: any = { send: vi.fn().mockResolvedValue(sent), messages: { fetch: vi.fn() } };
    (message.guild.channels.cache as Map<any, any>).set('STAR', channelMock);

    await (addHandler as any).run(reaction, { bot: false });

    expect(channelMock.send).toHaveBeenCalled();
    expect(fakeConfig.posts.length).toBe(1);
  });

  it('removes a starboard post when count drops below threshold', async () => {
    const { reaction, message } = createFakeReaction({ count: 1 });

    const saveMock = vi.fn();
    const fakeConfig: any = {
      guildId: 'G1',
      channelId: 'STAR',
      emoji: '⭐',
      threshold: 3,
      ignoredChannels: [],
      posts: [{ originalMessageId: 'M1', starboardMessageId: 'S1', count: 3 }],
      save: saveMock
    };

    (StarboardModel.findOne as any).mockImplementation(() => ({ exec: async () => fakeConfig }));

    const channelMock: any = { messages: { fetch: vi.fn().mockResolvedValue({ delete: vi.fn() }) } };
    (message.guild.channels.cache as Map<any, any>).set('STAR', channelMock);

    await (removeHandler as any).run(reaction, { bot: false });

    expect(channelMock.messages.fetch).toHaveBeenCalledWith('S1');
    expect(fakeConfig.posts.length).toBe(0);
  });
});
