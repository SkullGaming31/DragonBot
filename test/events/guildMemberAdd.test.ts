import { describe, it, expect, vi } from 'vitest';
import GuildMemberAdd from '../../src/Events/Logs/guildMemberAdd';
import settings from '../../src/Database/Schemas/settingsDB';
import WarningDB from '../../src/Database/Schemas/WarnDB';

settings.findOne = vi.fn().mockResolvedValue(null);
WarningDB.findOne = vi.fn().mockResolvedValue(null as any);

describe('guildMemberAdd event', () => {
  it('does not throw when no welcome channel configured', async () => {
    const member = {
      id: 'm1',
      guild: { id: 'g1', name: 'G', iconURL: () => null, channels: { cache: new Map() }, members: { addRole: vi.fn() }, roles: { cache: new Map() } },
      user: { id: 'u1', globalName: 'usr', displayAvatarURL: () => null, createdTimestamp: Date.now() },
    } as any;
    await (GuildMemberAdd as any).run(member);
    expect(true).toBe(true);
  });
});
