import { describe, it, expect, vi } from 'vitest';
import GuildBanAdd from '../../src/Events/Logs/guildBanAdd';
import LogsChannelDB from '../../src/Database/Schemas/LogsChannelDB';

// Ensure DB read short-circuits
LogsChannelDB.findOne = vi.fn().mockResolvedValue(null);

describe('guildBanAdd event', () => {
  it('does not throw when no logs channel configured', async () => {
    const guild = { id: 'g1', channels: { cache: new Map() } } as any;
    const user = { id: 'u1', username: 'baduser', bot: false } as any;
    await (GuildBanAdd as any).run(guild, user);
    expect(true).toBe(true);
  });
});
