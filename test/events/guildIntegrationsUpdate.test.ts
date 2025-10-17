import { describe, it, expect, vi } from 'vitest';
import GuildIntegrationsUpdate from '../../src/Events/Logs/guildIntegrationsUpdate';
import LogsChannelDB from '../../src/Database/Schemas/LogsChannelDB';

LogsChannelDB.findOne = vi.fn().mockResolvedValue(null);

describe('guildIntegrationsUpdate event', () => {
  it('does not throw when no config exists', async () => {
    const guild = { id: 'g1', name: 'GuildX', channels: { cache: new Map() } } as any;
    await (GuildIntegrationsUpdate as any).run(guild);
    expect(true).toBe(true);
  });
});
