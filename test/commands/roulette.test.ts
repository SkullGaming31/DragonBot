import { describe, it, expect, vi, beforeEach } from 'vitest';
import rouletteCmd from '../../src/Commands/Fun/roulette';
import RouletteModel from '../../src/Database/Schemas/rouletteDB';
import SettingsModel from '../../src/Database/Schemas/settingsDB';
import { UserModel } from '../../src/Database/Schemas/userModel';

function makeInteraction(overrides: any = {}) {
  const base: any = {
    options: { getInteger: () => 100 },
    user: { id: 'user2', username: 'tester' },
    guild: { id: 'g1', channels: { cache: new Map([['chan1', { id: 'chan1' }]]) }, ownerId: 'owner' },
    channel: { id: 'chan1' },
    deferReply: vi.fn(),
    editReply: vi.fn(),
    reply: vi.fn(),
  };
  return Object.assign(base, overrides);
}

describe('roulette command', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns when settings missing', async () => {
    vi.spyOn(SettingsModel, 'findOne').mockResolvedValueOnce(null as any);
    const interaction = makeInteraction();
    // @ts-ignore
    await (rouletteCmd as any).run({ interaction });
    expect(interaction.reply).toHaveBeenCalled();
  });

  it('creates user doc and handles insufficient funds', async () => {
    vi.spyOn(SettingsModel, 'findOne').mockResolvedValueOnce({ EconChan: 'chan1' } as any);
    vi.spyOn(UserModel, 'findOne').mockResolvedValueOnce({ balance: 0 } as any);
    vi.spyOn(RouletteModel, 'findOne').mockResolvedValueOnce(null as any);

    const interaction = makeInteraction();
    // @ts-ignore
    await (rouletteCmd as any).run({ interaction });
    expect(interaction.reply).toHaveBeenCalled();
  });
});
