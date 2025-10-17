import { describe, it, expect, vi } from 'vitest';
import ReactionRemove from '../../src/Events/Logs/messageReactionRemove';
import StarboardModel from '../../src/Database/Schemas/starboardDB';
StarboardModel.findOne = vi.fn().mockResolvedValue(null);

describe('messageReactionRemove basic', () => {
  it('handles missing config gracefully', async () => {
    const reaction = { message: { guild: { id: 'g1' } }, emoji: { toString: () => '⭐' }, count: 1 } as any;
    const user = { id: 'u1', bot: false } as any;
    await (ReactionRemove as any).run(reaction, user);
    expect(true).toBe(true);
  });
});
