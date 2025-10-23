import { describe, it, expect, vi, beforeEach } from 'vitest';
import balCmd from '../../src/Commands/Fun/bal';
import SettingsModel from '../../src/Database/Schemas/settingsDB';
import { UserModel } from '../../src/Database/Schemas/userModel';

function makeInteraction(overrides: any = {}) {
  const base: any = {
    options: { getUser: () => null },
    user: { id: 'user4', username: 'bob' },
    guild: { id: 'g1', name: 'TestGuild', channels: { cache: new Map() }, ownerId: 'owner' },
    channel: { id: 'chan1' },
    member: { id: 'user4', roles: { cache: new Map() } },
    reply: vi.fn(),
  };
  return Object.assign(base, overrides);
}

describe('bal command', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('replies when settings missing', async () => {
    vi.spyOn(SettingsModel, 'findOne').mockResolvedValueOnce(null as any);
    const interaction = makeInteraction();
    // @ts-ignore
    await (balCmd as any).run({ interaction });
    expect(interaction.reply).toHaveBeenCalled();
  });

  it('shows balance when user exists', async () => {
    vi.spyOn(SettingsModel, 'findOne').mockResolvedValueOnce({} as any);
    vi.spyOn(UserModel, 'findOne').mockResolvedValueOnce({ balance: 100, bank: 50, inventory: [], username: 'bob' } as any);
    vi.spyOn(UserModel, 'find').mockResolvedValueOnce([{ balance: 100 }] as any);
    const interaction = makeInteraction();
    // @ts-ignore
    await (balCmd as any).run({ interaction });
    expect(interaction.reply).toHaveBeenCalled();
  });
});
