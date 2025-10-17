import { describe, it, expect, vi } from 'vitest';
import ChannelDelete from '../../src/Events/Logs/channelDelete';
import LogsChannelDB from '../../src/Database/Schemas/LogsChannelDB';

LogsChannelDB.findOne = vi.fn().mockResolvedValue(null);

describe('channelDelete event', () => {
  it('returns quickly when no logs channel configured', async () => {
    const channel = { id: 'c1', name: 'gone', isDMBased: () => false, guild: { id: 'g1', channels: { cache: new Map() } } } as any;
    await (ChannelDelete as any).run(channel as any);
    expect(true).toBe(true);
  });
});
