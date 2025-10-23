import { describe, it, expect, vi, beforeEach } from 'vitest';

import ReactionCommand from '../../src/Commands/Moderator/reactionRoles';
import ReactionRoleModel from '../../src/Database/Schemas/reactionRole';

describe('reaction create_message failure cases', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('replies with an error and does not persist when channel.send rejects due to permissions', async () => {
    vi.spyOn(ReactionRoleModel, 'findOne').mockResolvedValueOnce(null as any);
    // Spy on create so we can assert it was not called
    vi.spyOn(ReactionRoleModel, 'create').mockResolvedValue(undefined as any);
    const sendErr: any = new Error('Missing Permissions');
    sendErr.code = 50013;
    sendErr.name = 'DiscordAPIError';

    const channel: any = { id: 'chan1', send: vi.fn().mockRejectedValue(sendErr) };

    const interaction: any = {
      options: { getSubcommand: () => 'create_message', getChannel: () => channel, getString: (n: string) => (n === 'message_content' ? 'Hello!' : 'emoji'), getRole: () => ({ id: 'r1' }), getStringOptional: () => null },
      guild: { id: 'g1' },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await (ReactionCommand as any).run({ interaction });

    expect(channel.send).toHaveBeenCalledWith('Hello!');
    expect(ReactionRoleModel.create).not.toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalled();
  });
});
