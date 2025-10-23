import { describe, it, expect, vi, beforeEach } from 'vitest';

import ReactionCommand from '../../src/Commands/Moderator/reactionRoles';
import * as cleanupModule from '../../src/Utilities/reactionCleanup';
import ReactionCleanupModel from '../../src/Database/Schemas/reactionCleanupDB';

describe('reaction cleanup subcommand', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('runs cleanup and replies with summary', async () => {
    const fakeResult = { checked: 10, removed: 2 };
    // spy on the cleanup function so the command's dynamic import will use the mocked resolver
    vi.spyOn(cleanupModule, 'runReactionCleanup' as any).mockResolvedValueOnce(fakeResult as any);

    const interaction: any = {
      options: { getSubcommand: () => 'cleanup', getString: () => undefined },
      guild: { id: 'g1' },
      memberPermissions: { has: () => true },
      client: { /* not used by mock */ },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await (ReactionCommand as any).run({ interaction });

    expect(interaction.reply).toHaveBeenCalledWith({ content: `Cleanup complete. Checked ${fakeResult.checked} mappings, removed ${fakeResult.removed}.`, ephemeral: true });
  });

  it('status returns last run info when present', async () => {
    const fakeDoc = { Guild: 'g1', lastRunAt: new Date('2025-01-01T00:00:00Z'), lastChecked: 5, lastRemoved: 1 } as any;
    vi.spyOn(ReactionCleanupModel as any, 'findOne' as any).mockImplementationOnce(() => ({ lean: () => Promise.resolve(fakeDoc) } as any));

    const interaction: any = {
      options: { getSubcommand: () => 'cleanup', getString: (n: string) => (n === 'mode' ? 'status' : undefined) },
      guild: { id: 'g1' },
      memberPermissions: { has: () => true },
      client: { /* not used by mock */ },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    await (ReactionCommand as any).run({ interaction });

    expect(interaction.reply).toHaveBeenCalledWith({ content: `Last cleanup: ${fakeDoc.lastRunAt.toISOString()} — checked ${fakeDoc.lastChecked}, removed ${fakeDoc.lastRemoved}.`, ephemeral: true });
  });
});
