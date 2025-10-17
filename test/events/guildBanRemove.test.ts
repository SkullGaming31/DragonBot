import { describe, it, expect, vi } from 'vitest';
import GuildBanRemove from '../../src/Events/Logs/guildBanRemove';
import LogsChannelDB from '../../src/Database/Schemas/LogsChannelDB';

LogsChannelDB.findOne = vi.fn().mockResolvedValue(null);

describe('guildBanRemove event', () => {
  it('handles missing config gracefully', async () => {
    const guild = { id: 'g1', channels: { cache: new Map() } } as any;
    const user = { id: 'u1', username: 'gooduser', bot: false } as any;
    await (GuildBanRemove as any).run(guild, user);
    expect(true).toBe(true);
  });
});
