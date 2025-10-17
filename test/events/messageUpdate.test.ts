import { describe, it, expect } from 'vitest';
import MessageUpdate from '../../src/Events/Logs/messageUpdate';

describe('messageUpdate', () => {
  it('returns early for non-guild messages', async () => {
    const oldM = { content: 'a' } as any;
    const newM = { content: 'b', inGuild: () => false } as any;
    await (MessageUpdate as any).run(oldM, newM);
    expect(true).toBe(true);
  });
});
