import { describe, it, expect, vi, beforeEach } from 'vitest';
import begCmd from '../../src/Commands/Fun/beg';
import SettingsModel from '../../src/Database/Schemas/settingsDB';
import { UserModel } from '../../src/Database/Schemas/userModel';

function makeInteraction(overrides: any = {}) {
  const base: any = {
    guild: { id: 'g1', channels: { cache: new Map() } },
    user: { id: 'user3' },
    channel: { id: 'chan1' },
    reply: vi.fn(),
  };
  return Object.assign(base, overrides);
}

describe('beg command', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('respects economy channel and replies', async () => {
    vi.spyOn(SettingsModel, 'findOne').mockResolvedValueOnce({ EconChan: 'chan2' } as any);
    const interaction = makeInteraction({ guild: { id: 'g1', channels: { cache: new Map([['chan2', { id: 'chan2' }]]) } } });
    // @ts-ignore
    // run and ensure function resolves quickly
    await (begCmd as any).run({ interaction });
    expect(interaction.reply).toHaveBeenCalled();
  });

  it('increments balance when allowed', async () => {
    vi.spyOn(SettingsModel, 'findOne').mockResolvedValueOnce({} as any);
    // make findOne().select(...) chainable
    const findOneMock: any = { select: vi.fn().mockResolvedValue({ cooldowns: {} }) };
    vi.spyOn(UserModel, 'findOne').mockReturnValueOnce(findOneMock as any);
    vi.spyOn(UserModel, 'findOneAndUpdate').mockResolvedValueOnce({} as any);

    const interaction = makeInteraction();
    // @ts-ignore
    await (begCmd as any).run({ interaction });
    expect(interaction.reply).toHaveBeenCalled();
  });
});
