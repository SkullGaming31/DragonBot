import { describe, it, expect, vi, beforeEach } from 'vitest';

import acceptButton from '../../src/Buttons/accept';
import SettingsModel from '../../src/Database/Schemas/settingsDB';
import ChanLogger from '../../src/Database/Schemas/LogsChannelDB';

describe('accept button handler', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('adds role when member does not have it and logs', async () => {
    // Mock settings to include rulesChannel and MemberRole
    vi.spyOn(SettingsModel, 'findOne').mockResolvedValue({ rulesChannel: 'rules1', MemberRole: 'role1' } as any);
    vi.spyOn(ChanLogger, 'findOne').mockResolvedValue({ Channel: 'log1' } as any);

    const role = { id: 'role1', name: 'Member' } as any;

    const member = {
      id: 'm1',
      user: { username: 'u1' },
      roles: { cache: new Map(), add: vi.fn().mockResolvedValue(undefined), remove: vi.fn().mockResolvedValue(undefined) }
    } as any;

    const guild = {
      id: 'g1',
      name: 'Guild',
      roles: { cache: new Map([['role1', role]]) },
      channels: { cache: new Map([['log1', { send: vi.fn().mockResolvedValue(undefined), type: 0 }]]) },
      members: { fetch: vi.fn().mockResolvedValue(member) }
    } as any;

    const interaction: any = {
      user: { id: 'm1' },
      guild,
      channelId: 'rules1',
      reply: vi.fn().mockResolvedValue(undefined)
    };

    await acceptButton.run({ interaction } as any);

    expect(member.roles.add).toHaveBeenCalledWith(role);
    expect(interaction.reply).toHaveBeenCalled();
  });

  it('removes role when member already has it', async () => {
    vi.spyOn(SettingsModel, 'findOne').mockResolvedValue({ rulesChannel: 'rules1', MemberRole: 'role1' } as any);
    vi.spyOn(ChanLogger, 'findOne').mockResolvedValue(null as any);

    const role = { id: 'role1', name: 'Member' } as any;

    const member = {
      id: 'm1',
      user: { username: 'u1' },
      roles: { cache: new Map([['role1', role]]), add: vi.fn().mockResolvedValue(undefined), remove: vi.fn().mockResolvedValue(undefined) }
    } as any;

    const guild = {
      id: 'g1',
      name: 'Guild',
      roles: { cache: new Map([['role1', role]]) },
      channels: { cache: new Map() },
      members: { fetch: vi.fn().mockResolvedValue(member) }
    } as any;

    const interaction: any = {
      user: { id: 'm1' },
      guild,
      channelId: 'rules1',
      reply: vi.fn().mockResolvedValue(undefined)
    };

    await acceptButton.run({ interaction } as any);

    expect(member.roles.remove).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalled();
  });
});
