import { describe, it, expect, vi } from 'vitest';
import EmojiCreate from '../../src/Events/Logs/emojiCreate';
import LogsChannelDB from '../../src/Database/Schemas/LogsChannelDB';

LogsChannelDB.findOne = vi.fn().mockResolvedValue(null);

describe('emojiCreate event', () => {
  it('does not throw when no logs channel configured', async () => {
    const emoji = { id: 'e1', name: 'smile', guild: { id: 'g1', channels: { cache: new Map() } } } as any;
    await (EmojiCreate as any).run(emoji);
    expect(true).toBe(true);
  });
});
