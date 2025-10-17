import { describe, it, expect, vi } from 'vitest';
import GuildMemberUpdate from '../../src/Events/Logs/guildMemberUpdate';
import ChanLogger from '../../src/Database/Schemas/LogsChannelDB';

ChanLogger.findOne = vi.fn().mockResolvedValue(null);

describe('guildMemberUpdate event', () => {
  it('does not throw when no config exists', async () => {
    const guild = { id: 'g1', name: 'G', roles: { cache: new Map() }, channels: { cache: new Map() } } as any;
    const oldMember = { id: 'm1', roles: { cache: new Map() }, nickname: 'old', premiumSince: null } as any;
    const newMember = { id: 'm1', roles: { cache: new Map() }, nickname: 'new', premiumSince: null, user: { globalName: 'user' }, guild } as any;
    await (GuildMemberUpdate as any).run(oldMember, newMember);
    expect(true).toBe(true);
  });
});
