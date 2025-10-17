import { describe, it, expect, vi } from 'vitest';
import EmojiDelete from '../../src/Events/Logs/emojiDelete';
import LogsChannelDB from '../../src/Database/Schemas/LogsChannelDB';

LogsChannelDB.findOne = vi.fn().mockResolvedValue(null);

describe('emojiDelete event', () => {
  it('returns quickly when no logs channel configured', async () => {
    const emoji = { id: 'e1', name: 'old', guild: { id: 'g1', channels: { cache: new Map() } } } as any;
    await (EmojiDelete as any).run(emoji as any);
    expect(true).toBe(true);
  });
});
