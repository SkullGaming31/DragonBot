import { describe, it, expect, vi } from 'vitest';
import RoleUpdate from '../../src/Events/Logs/roleUpdate';
import LogsChannelDB from '../../src/Database/Schemas/LogsChannelDB';

LogsChannelDB.findOne = vi.fn().mockResolvedValue(null);

describe('roleUpdate event', () => {
  it('does not throw when no config exists', async () => {
    const oldR = { id: 'r1', name: 'a', equals: (other: any) => false } as any;
    const newR = { id: 'r1', name: 'b', equals: (other: any) => false } as any;
    await (RoleUpdate as any).run(oldR, newR);
    expect(true).toBe(true);
  });
});
