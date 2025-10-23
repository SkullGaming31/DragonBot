import { describe, it, expect, vi, beforeEach } from 'vitest';
import MessageDelete from '../../src/Events/Logs/messageDelete';
import ReactionRoleModel from '../../src/Database/Schemas/reactionRole';

beforeEach(() => {
  vi.restoreAllMocks();
  ReactionRoleModel.deleteMany = vi.fn().mockResolvedValue({ deletedCount: 0 } as any);
});

describe('messageDelete handler basic', () => {
  it('does not throw for partial message without guild', async () => {
    const msg = { guild: null } as any;
    await (MessageDelete as any).run(msg).catch((e: any) => { throw e; });
    expect(true).toBe(true);
  });
});
