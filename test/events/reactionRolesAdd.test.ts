import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReactionAdd from '../../src/Events/customMessage/reactionRolesAdd';
import ReactionRoleModel from '../../src/Database/Schemas/reactionRole';

describe('reactionRolesAdd', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('adds role when mapping exists (unicode emoji)', async () => {
    // mock mapping: make find() return an object with a lean() method
    vi.spyOn(ReactionRoleModel, 'find' as any).mockImplementation(() => ({ lean: () => Promise.resolve([{ roleId: 'r1' }]) }));

    const member = { roles: { add: vi.fn().mockResolvedValue(true) } } as any;
    const guild = { id: 'g1', members: { fetch: vi.fn().mockResolvedValue(member) } } as any;
    const message = { id: 'm1', guild, channelId: 'c1' } as any;
    const reaction = { partial: false, message, emoji: { id: null, name: '🚀' } } as any;
    const user = { id: 'u1' } as any;

    await (ReactionAdd as any).run(reaction, user);

    expect(member.roles.add).toHaveBeenCalledWith('r1', 'reaction-role add');
  });

  it('normalizes custom guild emoji to name:id when emoji has an id', async () => {
    // ensure find() receives the expected emoji identifier
    vi.spyOn(ReactionRoleModel, 'find' as any).mockImplementation((filter: any) => {
      expect(filter).toEqual({ guildId: 'g1', messageId: 'm1', emoji: 'party_parrot:827364827364827364' });
      return { lean: () => Promise.resolve([{ roleId: 'r1' }]) };
    });

    const member = { roles: { add: vi.fn().mockResolvedValue(true) } } as any;
    const guild = { id: 'g1', members: { fetch: vi.fn().mockResolvedValue(member) } } as any;
    const message = { id: 'm1', guild, channelId: 'c1' } as any;
    const reaction = { partial: false, message, emoji: { id: '827364827364827364', name: 'party_parrot' } } as any;
    const user = { id: 'u1' } as any;

    await (ReactionAdd as any).run(reaction, user);

    expect(member.roles.add).toHaveBeenCalledWith('r1', 'reaction-role add');
  });
});
