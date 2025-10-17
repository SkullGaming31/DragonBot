import { describe, it, expect, vi } from 'vitest';
import ThreadCreate from '../../src/Events/Logs/threadCreate';
import ChanLogger from '../../src/Database/Schemas/LogsChannelDB';

ChanLogger.findOne = vi.fn().mockResolvedValue(null);

describe('threadCreate event', () => {
  it('does not throw when no logs channel configured', async () => {
    const thread = { id: 't1', name: 'th', guild: { id: 'g1', channels: { cache: new Map(), fetch: vi.fn() } } } as any;
    await (ThreadCreate as any).run(thread, true);
    expect(true).toBe(true);
  });
});
