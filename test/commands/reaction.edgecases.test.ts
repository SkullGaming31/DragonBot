import { describe, it, expect, vi, beforeEach } from 'vitest';

import ReactionCommand from '../../src/Commands/Moderator/reactionRoles';
import ReactionRoleModel from '../../src/Database/Schemas/reactionRole';
import ReactionAdd from '../../src/Events/customMessage/reactionRolesAdd';

describe('reaction command edge-cases', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('create: prevents duplicate mapping', async () => {
    // pretend an existing mapping is found
    vi.spyOn(ReactionRoleModel, 'findOne' as any).mockResolvedValueOnce({ _id: 'exists' } as any);
    // ensure create is a spy so we can assert it was not called
    vi.spyOn(ReactionRoleModel, 'create' as any).mockResolvedValueOnce(undefined as any);

    const channel = { id: 'chan1' } as any;
    const interaction: any = {
      options: { getSubcommand: () => 'create', getChannel: () => channel, getString: (n: string) => (n === 'message_id' ? 'mid' : '🚀'), getRole: () => ({ id: 'r1' }), getStringOptional: () => null },
      guild: { id: 'g1' },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await (ReactionCommand as any).run({ interaction });

    expect(interaction.reply).toHaveBeenCalled();
    // create should not be called because mapping exists
    expect(ReactionRoleModel.create).not.toHaveBeenCalled();
  });

  it('create: invalid emoji (react throws) still replies and persists mapping', async () => {
    // simulate no existing mapping
    vi.spyOn(ReactionRoleModel, 'findOne' as any).mockResolvedValueOnce(null as any);
    const fakeDoc = { _id: 'abc' } as any;
    vi.spyOn(ReactionRoleModel, 'create' as any).mockResolvedValueOnce(fakeDoc as any);

    // channel.messages.fetch resolves but react fails (invalid emoji)
    const channel = { id: 'chan1', messages: { fetch: vi.fn().mockResolvedValue({ react: vi.fn().mockRejectedValue(new Error('Unknown emoji')) }) } } as any;
    const interaction: any = {
      options: { getSubcommand: () => 'create', getChannel: () => channel, getString: (n: string) => (n === 'message_id' ? 'mid' : (n === 'emoji' ? 'not_an_emoji' : undefined)), getRole: () => ({ id: 'r1' }), getStringOptional: () => null },
      guild: { id: 'g1' },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await (ReactionCommand as any).run({ interaction });

    expect(ReactionRoleModel.create).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalled();
  });

  it('create: message not found (fetch throws) still replies and persists mapping', async () => {
    vi.spyOn(ReactionRoleModel, 'findOne' as any).mockResolvedValueOnce(null as any);
    const fakeDoc = { _id: 'abc' } as any;
    vi.spyOn(ReactionRoleModel, 'create' as any).mockResolvedValueOnce(fakeDoc as any);

    const channel = { id: 'chan1', messages: { fetch: vi.fn().mockRejectedValue(new Error('Not found')) } } as any;
    const interaction: any = {
      options: { getSubcommand: () => 'create', getChannel: () => channel, getString: (n: string) => (n === 'message_id' ? 'mid' : (n === 'emoji' ? '🚀' : undefined)), getRole: () => ({ id: 'r1' }), getStringOptional: () => null },
      guild: { id: 'g1' },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await (ReactionCommand as any).run({ interaction });

    expect(ReactionRoleModel.create).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalled();
  });

  it('delete: non-existent mapping replies gracefully', async () => {
    vi.spyOn(ReactionRoleModel, 'findOneAndDelete' as any).mockResolvedValueOnce(null as any);
    const interaction: any = { options: { getSubcommand: () => 'delete', getString: () => 'nope' }, guild: { id: 'g1' }, reply: vi.fn().mockResolvedValue(undefined) };
    await (ReactionCommand as any).run({ interaction });
    expect(interaction.reply).toHaveBeenCalled();
  });

  it('reaction add: missing role on mapping should be logged but not throw', async () => {
    // mapping references a role id which when roles.add is called will throw (missing perms)
    vi.spyOn(ReactionRoleModel, 'find' as any).mockImplementation(() => ({ lean: () => Promise.resolve([{ roleId: 'r_missing' }]) }));

    const member = { roles: { add: vi.fn().mockRejectedValue(new Error('Missing Permissions')) } } as any;
    const guild = { id: 'g1', members: { fetch: vi.fn().mockResolvedValue(member) } } as any;
    const message = { id: 'm1', guild } as any;
    const reaction = { partial: false, message, emoji: { id: null, name: '🚀' } } as any;
    const user = { id: 'u1' } as any;

    // ensure handler doesn't throw and still attempted to add the role
    await (ReactionAdd as any).run(reaction, user);
    expect(member.roles.add).toHaveBeenCalled();
  });
});
