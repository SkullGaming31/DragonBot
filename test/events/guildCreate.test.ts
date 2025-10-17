import { describe, it, expect, vi } from 'vitest';
import GuildCreate from '../../src/Events/Logs/guildCreate';
import LogsChannelDB from '../../src/Database/Schemas/LogsChannelDB';

// Mock DB reads to avoid network
LogsChannelDB.findOne = vi.fn().mockResolvedValue(null);

describe('guildCreate event', () => {
  it('does not throw when no logs channel configured', async () => {
    const guild = { id: 'g1', name: 'MyGuild', channels: { cache: new Map() } } as any;
    await (GuildCreate as any).run(guild);
    expect(true).toBe(true);
  });
});
