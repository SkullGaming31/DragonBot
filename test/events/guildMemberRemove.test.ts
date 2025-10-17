import { describe, it, expect, vi } from 'vitest';
import GuildMemberRemove from '../../src/Events/Logs/guildMemberRemove';
import settings from '../../src/Database/Schemas/settingsDB';
import ChanLogger from '../../src/Database/Schemas/LogsChannelDB';

settings.findOne = vi.fn().mockResolvedValue(null);
ChanLogger.findOne = vi.fn().mockResolvedValue(null);

describe('guildMemberRemove event', () => {
  it('does not throw when no config exists', async () => {
    const member = {
      id: 'm1',
      guild: { id: 'g1', channels: { cache: new Map() } },
      user: { id: 'u1', globalName: 'usr', displayAvatarURL: () => null },
      joinedTimestamp: Date.now()
    } as any;
    await (GuildMemberRemove as any).run(member);
    expect(true).toBe(true);
  });
});
