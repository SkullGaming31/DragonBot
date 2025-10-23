import { describe, it, expect, vi } from 'vitest';
import RoleDelete from '../../src/Events/Logs/roleDelete';
import LogsChannelDB from '../../src/Database/Schemas/LogsChannelDB';
import ReactionRoleModel from '../../src/Database/Schemas/reactionRole';

LogsChannelDB.findOne = vi.fn().mockResolvedValue(null);
ReactionRoleModel.deleteMany = vi.fn().mockResolvedValue({ deletedCount: 0 } as any);

describe('roleDelete event', () => {
  it('does not throw when no config exists', async () => {
    const role = { id: 'r1', name: 'oldRole', guild: { id: 'g1', channels: { cache: new Map() } } } as any;
    await (RoleDelete as any).run(role as any);
    expect(true).toBe(true);
  });
});
