import { describe, it, expect, vi } from 'vitest';
import ChannelCreate from '../../src/Events/Logs/channelCreate';
import LogsChannelDB from '../../src/Database/Schemas/LogsChannelDB';

LogsChannelDB.findOne = vi.fn().mockResolvedValue(null);

describe('channelCreate event', () => {
  it('does not throw when no logs channel configured', async () => {
    const channel = { id: 'c1', name: 'new-channel', guild: { id: 'g1', channels: { cache: new Map() } } } as any;
    await (ChannelCreate as any).run(channel);
    expect(true).toBe(true);
  });
});
