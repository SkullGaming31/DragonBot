import { describe, it, expect } from 'vitest';
import MessageDelete from '../../src/Events/Logs/messageDelete';

describe('messageDelete handler basic', () => {
  it('does not throw for partial message without guild', async () => {
    const msg = { guild: null } as any;
    await (MessageDelete as any).run(msg).catch((e: any) => { throw e; });
    expect(true).toBe(true);
  });
});
