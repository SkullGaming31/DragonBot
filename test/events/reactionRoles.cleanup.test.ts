import { describe, it, expect, vi, beforeEach } from 'vitest';

import RoleDelete from '../../src/Events/Logs/roleDelete';
import MessageDelete from '../../src/Events/Logs/messageDelete';
import ReactionRoleModel from '../../src/Database/Schemas/reactionRole';
import ChanLogger from '../../src/Database/Schemas/LogsChannelDB';

describe('reaction-role cleanup on deletions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // prevent the handlers from trying to read/write logs channel config in tests
    ChanLogger.findOne = vi.fn().mockResolvedValue(null as any);
  });

  it('roleDelete: removes mappings referencing deleted role', async () => {
    vi.spyOn(ReactionRoleModel, 'deleteMany' as any).mockResolvedValueOnce({ deletedCount: 2 } as any);
    const role = { id: 'r1', name: 'old', guild: { id: 'g1', channels: { cache: new Map() } } } as any;
    await (RoleDelete as any).run(role as any);
    expect(ReactionRoleModel.deleteMany).toHaveBeenCalledWith({ guildId: 'g1', roleId: 'r1' });
  });

  it('messageDelete: removes mappings referencing deleted message', async () => {
    vi.spyOn(ReactionRoleModel, 'deleteMany' as any).mockResolvedValueOnce({ deletedCount: 3 } as any);
    const msg = { id: 'm1', guild: { id: 'g1', channels: { cache: new Map() } }, author: { id: 'u1' }, channel: { id: 'c1' }, content: 'x' } as any;
    await (MessageDelete as any).run(msg as any);
    expect(ReactionRoleModel.deleteMany).toHaveBeenCalledWith({ guildId: 'g1', messageId: 'm1' });
  });
});
