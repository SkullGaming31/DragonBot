import { describe, it, expect, vi } from 'vitest';
import RoleCreate from '../../src/Events/Logs/roleCreate';
import LogsChannelDB from '../../src/Database/Schemas/LogsChannelDB';

LogsChannelDB.findOne = vi.fn().mockResolvedValue(null);

describe('roleCreate event', () => {
  it('does not throw when no config exists', async () => {
    const role = { id: 'r1', name: 'newRole', guild: { id: 'g1', channels: { cache: new Map() } } } as any;
    await (RoleCreate as any).run(role as any);
    expect(true).toBe(true);
  });
});
