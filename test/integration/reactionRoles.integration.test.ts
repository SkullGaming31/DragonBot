import { describe, it, expect, vi, beforeEach } from 'vitest';

import ReactionRolesAdd from '../../src/Events/customMessage/reactionRolesAdd';
import ReactionRolesRemove from '../../src/Events/customMessage/reactionRolesRemove';
import ReactionRoleModel from '../../src/Database/Schemas/reactionRole';

describe('integration-like reaction role flow', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('adds and removes roles when reactions change', async () => {
    const roleId = 'role1';

    // Mock DB to return a mapping for the message and emoji
    vi.spyOn(ReactionRoleModel, 'find').mockImplementation(() => ({ lean: () => Promise.resolve([{ roleId }]) } as any));

    const member = { id: 'm1', roles: { add: vi.fn().mockResolvedValue(undefined), remove: vi.fn().mockResolvedValue(undefined) } } as any;

    const guild = { id: 'g1', members: { fetch: vi.fn().mockResolvedValue(member) } } as any;

    const message = { id: 'mid', guild } as any;

    // fake reaction object with emoji name (unicode) and no id
    const reaction = { partial: false, message, emoji: { id: null, name: '✅' } } as any;
    const user = { id: 'm1' } as any;

    // Call the add handler
    await (ReactionRolesAdd as any).run(reaction, user);
    expect(member.roles.add).toHaveBeenCalledWith(roleId, 'reaction-role add');

    // Call the remove handler
    await (ReactionRolesRemove as any).run(reaction, user);
    expect(member.roles.remove).toHaveBeenCalledWith(roleId, 'reaction-role remove');
  });
});
