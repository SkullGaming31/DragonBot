import { describe, it, expect, vi } from 'vitest';
import GuildAuditLogEntryCreate from '../../src/Events/Logs/guildAuditLogEntryCreate';
import LogsChannelDB from '../../src/Database/Schemas/LogsChannelDB';

LogsChannelDB.findOne = vi.fn().mockResolvedValue(null);

describe('guildAuditLogEntryCreate event', () => {
  it('does not throw when no config exists', async () => {
    const entry = { id: 'a1', action: 'ROLE_CREATE', executor: { id: 'u1' }, guild: { id: 'g1', channels: { cache: new Map() } } } as any;
    await (GuildAuditLogEntryCreate as any).run(entry as any);
    expect(true).toBe(true);
  });
});
