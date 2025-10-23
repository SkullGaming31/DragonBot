import { describe, it, expect, vi, beforeEach } from 'vitest';
import gambleCmd from '../../src/Commands/Fun/gamble';
import { UserModel } from '../../src/Database/Schemas/userModel';

// Minimal mock interaction used for command run invocation
function makeInteraction(overrides: any = {}) {
  const base: any = {
    options: { getNumber: () => 1, getString: () => 'fixed number' },
    member: { roles: { cache: new Map() } },
    user: { id: 'user1' },
    guild: { id: 'g1' },
    reply: vi.fn(),
  };
  return Object.assign(base, overrides);
}

describe('gamble command', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('replies with an error when user has no model', async () => {
    vi.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null as any);
    const interaction = makeInteraction();

    // run the command
    // @ts-ignore - Command.run signature is compatible enough for test
    await (gambleCmd as any).run({ interaction });

    expect(interaction.reply).toHaveBeenCalled();
  });
});
