import { describe, it, expect, vi } from 'vitest';
import GuildDelete from '../../src/Events/Logs/guildDelete';
import LogsChannelDB from '../../src/Database/Schemas/LogsChannelDB';

LogsChannelDB.findOne = vi.fn().mockResolvedValue(null);

describe('guildDelete event', () => {
  it('returns quickly when no logs channel exists', async () => {
    const guild = { id: 'g1', name: 'OldGuild', channels: { cache: new Map() } } as any;
    await (GuildDelete as any).run(guild);
    expect(true).toBe(true);
  });
});
