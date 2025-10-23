import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReactionRemove from '../../src/Events/customMessage/reactionRolesRemove';
import ReactionRoleModel from '../../src/Database/Schemas/reactionRole';

describe('reactionRolesRemove', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('removes role when mapping exists (custom emoji)', async () => {
    // mock mapping for custom emoji format name:id — return object with lean()
    vi.spyOn(ReactionRoleModel, 'find' as any).mockImplementation(() => ({ lean: () => Promise.resolve([{ roleId: 'r2' }]) }));

    const member = { roles: { remove: vi.fn().mockResolvedValue(true) } } as any;
    const guild = { id: 'g1', members: { fetch: vi.fn().mockResolvedValue(member) } } as any;
    const message = { id: 'm2', guild, channelId: 'c1' } as any;
    const reaction = { partial: false, message, emoji: { id: '12345', name: 'custom' } } as any;
    const user = { id: 'u2' } as any;

    await (ReactionRemove as any).run(reaction, user);

    expect(member.roles.remove).toHaveBeenCalledWith('r2', 'reaction-role remove');
  });
});
