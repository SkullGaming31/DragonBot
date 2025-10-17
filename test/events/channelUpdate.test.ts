import { describe, it, expect, vi } from 'vitest';
import ChannelUpdate from '../../src/Events/Logs/channelUpdate';
import LogsChannelDB from '../../src/Database/Schemas/LogsChannelDB';

LogsChannelDB.findOne = vi.fn().mockResolvedValue(null);

describe('channelUpdate event', () => {
  it('does not throw when no config exists', async () => {
    const oldCh = { id: 'c1', name: 'a', isDMBased: () => false } as any;
    const newCh = { id: 'c1', name: 'b', isDMBased: () => false } as any;
    await (ChannelUpdate as any).run(oldCh, newCh);
    expect(true).toBe(true);
  });
});
