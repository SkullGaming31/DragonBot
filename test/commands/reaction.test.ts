import { describe, it, expect, vi, beforeEach } from 'vitest';

import ReactionCommand from '../../src/Commands/Moderator/reactionRoles';
import ReactionRoleModel from '../../src/Database/Schemas/reactionRole';

describe('reaction command subcommands', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('create: saves mapping and reacts to message', async () => {
    const fakeDoc = { _id: 'abc' } as any;
    vi.spyOn(ReactionRoleModel, 'findOne').mockResolvedValueOnce(null as any);
    vi.spyOn(ReactionRoleModel, 'create').mockResolvedValueOnce(fakeDoc as any);

    const channel = { id: 'chan1', messages: { fetch: vi.fn().mockResolvedValue({ react: vi.fn().mockResolvedValue(undefined) }) } } as any;
    const interaction: any = {
      options: { getSubcommand: () => 'create', getChannel: () => channel, getString: (n: string) => (n === 'message_id' ? 'mid' : (n === 'emoji' ? 'emoji' : undefined)), getRole: () => ({ id: 'r1' }), getStringOptional: () => null },
      guild: { id: 'g1' },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    // spy on audit helper before running so the dynamic import IIFE uses our spy
    const audit = await import('../../src/Utilities/audit');
    const sendSpy = vi.spyOn(audit, 'sendGuildLog').mockResolvedValueOnce(true as any);

    await (ReactionCommand as any).run({ interaction });

    // allow the background IIFE to run
    await new Promise((r) => setTimeout(r, 10));

    expect(ReactionRoleModel.create).toHaveBeenCalled();
    expect(interaction.reply).toHaveBeenCalled();
    expect(sendSpy).toHaveBeenCalled();
    const embedArg = sendSpy.mock.calls[0][1];
    // check embed title exists and is expected
    // embedArg may be an EmbedBuilder instance; access data safely
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((embedArg as any).data.title).toBe('Reaction Role Mapping Created');
  });

  it('list: shows no mappings when none exist', async () => {
    // Mock find() to return an object with lean() following code's usage
    vi.spyOn(ReactionRoleModel, 'find').mockImplementationOnce(() => ({ lean: () => Promise.resolve([]) } as any));
    const interaction: any = { options: { getSubcommand: () => 'list' }, guild: { id: 'g1' }, reply: vi.fn().mockResolvedValue(undefined) };
    await (ReactionCommand as any).run({ interaction });
    expect(interaction.reply).toHaveBeenCalled();
  });

  it('delete: removes mapping when found', async () => {
    vi.spyOn(ReactionRoleModel, 'findOneAndDelete').mockResolvedValueOnce({ _id: 'x', channelId: 'chan1', messageId: 'mid', emoji: 'e', roleId: 'r1' } as any);
    const interaction: any = { options: { getSubcommand: () => 'delete', getString: () => 'x' }, guild: { id: 'g1' }, reply: vi.fn().mockResolvedValue(undefined) };

    const audit = await import('../../src/Utilities/audit');
    const sendSpy = vi.spyOn(audit, 'sendGuildLog').mockResolvedValueOnce(true as any);

    await (ReactionCommand as any).run({ interaction });
    await new Promise((r) => setTimeout(r, 10));

    expect(ReactionRoleModel.findOneAndDelete).toHaveBeenCalled();
    expect(sendSpy).toHaveBeenCalled();
    const embedArg = sendSpy.mock.calls[0][1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((embedArg as any).data.title).toBe('Reaction Role Mapping Deleted');
  });

  it('create: when message_content provided, bot creates the message and persists mapping', async () => {
    const fakeDoc = { _id: 'fromContent' } as any;
    vi.spyOn(ReactionRoleModel, 'findOne').mockResolvedValueOnce(null as any);
    vi.spyOn(ReactionRoleModel, 'create').mockResolvedValueOnce(fakeDoc as any);

    const channel = { id: 'chan1', send: vi.fn().mockResolvedValue({ id: 'newMsg' }), messages: { fetch: vi.fn().mockResolvedValue({ react: vi.fn().mockResolvedValue(undefined) }) } } as any;
    const interaction: any = {
      options: { getSubcommand: () => 'create_message', getChannel: () => channel, getString: (n: string) => (n === 'emoji' ? 'emoji' : (n === 'message_content' ? 'Hello!' : null)), getRole: () => ({ id: 'r1' }), getStringOptional: () => null },
      guild: { id: 'g1' },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    const audit = await import('../../src/Utilities/audit');
    const sendSpy = vi.spyOn(audit, 'sendGuildLog').mockResolvedValueOnce(true as any);

    await (ReactionCommand as any).run({ interaction });
    await new Promise((r) => setTimeout(r, 10));

    expect(ReactionRoleModel.create).toHaveBeenCalled();
    expect(channel.send).toHaveBeenCalledWith('Hello!');
    expect(sendSpy).toHaveBeenCalled();
  });

  it('create: providing both message_id and message_content should be rejected', async () => {
    const channel = { id: 'chan1' } as any;
    const interaction: any = {
      options: { getSubcommand: () => 'create_message', getChannel: () => channel, getString: (n: string) => (n === 'message_id' ? 'mid' : (n === 'message_content' ? 'x' : 'emoji')), getRole: () => ({ id: 'r1' }), getStringOptional: () => null },
      guild: { id: 'g1' },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await (ReactionCommand as any).run({ interaction });
    expect(interaction.reply).toHaveBeenCalled();
  });

  it('create: when message_content send fails and no message_id provided, reply with error', async () => {
    vi.spyOn(ReactionRoleModel, 'findOne').mockResolvedValueOnce(null as any);
    const channel = { id: 'chan1', send: vi.fn().mockRejectedValue(new Error('fail')) } as any;
    const interaction: any = {
      options: { getSubcommand: () => 'create_message', getChannel: () => channel, getString: (n: string) => (n === 'message_content' ? 'Hello!' : 'emoji'), getRole: () => ({ id: 'r1' }), getStringOptional: () => null },
      guild: { id: 'g1' },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await (ReactionCommand as any).run({ interaction });
    expect(interaction.reply).toHaveBeenCalled();
  });
});
