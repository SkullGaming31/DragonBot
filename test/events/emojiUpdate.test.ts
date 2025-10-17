import { describe, it, expect, vi } from 'vitest';
import EmojiUpdate from '../../src/Events/Logs/emojiUpdate';
import LogsChannelDB from '../../src/Database/Schemas/LogsChannelDB';

LogsChannelDB.findOne = vi.fn().mockResolvedValue(null);

describe('emojiUpdate event', () => {
  it('does not throw when no config exists', async () => {
    const oldE = { id: 'e1', name: 'a' } as any;
    const newE = { id: 'e1', name: 'b' } as any;
    await (EmojiUpdate as any).run(oldE, newE);
    expect(true).toBe(true);
  });
});
