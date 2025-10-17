import { describe, it, expect, vi } from 'vitest';
import ReactionAdd from '../../src/Events/Logs/messageReactionAdd';
// ensure DB read is mocked
import StarboardModel from '../../src/Database/Schemas/starboardDB';
StarboardModel.findOne = vi.fn().mockResolvedValue(null);

describe('messageReactionAdd (starboard) basic', () => {
  it('does not throw when reaction is partial and no config', async () => {
    const reaction = { message: { guild: { id: 'g1' } }, emoji: { toString: () => '⭐' }, count: 1 } as any;
    const user = { id: 'u1', bot: false } as any;
    await (ReactionAdd as any).run(reaction, user);
    expect(true).toBe(true);
  });
});
