import { describe, it, expect, vi } from 'vitest';
import ThreadDelete from '../../src/Events/Logs/threadDelete';
import ChanLogger from '../../src/Database/Schemas/LogsChannelDB';

ChanLogger.findOne = vi.fn().mockResolvedValue(null);

describe('threadDelete event', () => {
  it('does not throw when no logs channel configured or parent not a forum', async () => {
    const thread = { id: 't1', name: 'th', guild: { id: 'g1', channels: { cache: new Map(), fetch: vi.fn() } }, parent: { type: 0 } } as any;
    await (ThreadDelete as any).run(thread);
    expect(true).toBe(true);
  });
});
