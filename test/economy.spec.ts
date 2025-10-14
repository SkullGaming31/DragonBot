import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/Database/Schemas/userModel', () => ({
  UserModel: {
    findOneAndUpdate: vi.fn(),
    findOne: vi.fn()
  }
}));

vi.mock('../src/Database/Schemas/settingsDB', () => ({
  default: {
    findOne: vi.fn()
  }
}));

import SettingsModel from '../src/Database/Schemas/settingsDB';
import { UserModel } from '../src/Database/Schemas/userModel';
import depositCmd from '../src/Commands/Fun/deposit';
import withdrawCmd from '../src/Commands/Fun/withdraw';

function makeInteraction(amount: string) {
  return {
    guild: { id: 'G1', channels: { cache: new Map() } },
    user: { id: 'U1' },
    options: { getString: (k: string, r: boolean) => amount },
    channel: { id: 'C1' },
    reply: vi.fn()
  } as any;
}

describe('Economy deposit/withdraw handlers', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('deposit succeeds when sufficient balance', async () => {
    (SettingsModel.findOne as any).mockResolvedValue({ EconChan: undefined });
    (UserModel.findOne as any).mockImplementation(() => ({ exec: async () => ({ balance: 100 }) }));
    (UserModel.findOneAndUpdate as any).mockImplementation(() => ({ exec: async () => ({ balance: 75, bank: 25 }) }));
    const i = makeInteraction('25');
    await (depositCmd as any).run({ interaction: i });
    expect(i.reply).toHaveBeenCalled();
  });

  it('deposit fails when insufficient balance', async () => {
    (SettingsModel.findOne as any).mockResolvedValue({ EconChan: undefined });
    (UserModel.findOne as any).mockImplementation(() => ({ exec: async () => ({ balance: 10 }) }));
    (UserModel.findOneAndUpdate as any).mockImplementation(() => ({ exec: async () => null }));
    const i = makeInteraction('9999');
    await (depositCmd as any).run({ interaction: i });
    expect(i.reply).toHaveBeenCalled();
  });

  it('withdraw succeeds when sufficient bank', async () => {
    (SettingsModel.findOne as any).mockResolvedValue({ EconChan: undefined });
    (UserModel.findOne as any).mockImplementation(() => ({ select: () => ({ exec: async () => ({ bank: 50 }) }), exec: async () => ({ bank: 50 }) }));
    (UserModel.findOneAndUpdate as any).mockImplementation(() => ({ exec: async () => ({ balance: 200, bank: 0 }) }));
    const i = makeInteraction('all');
    await (withdrawCmd as any).run({ interaction: i });
    expect(i.reply).toHaveBeenCalled();
  });

  it('withdraw fails when insufficient bank', async () => {
    (SettingsModel.findOne as any).mockResolvedValue({ EconChan: undefined });
    (UserModel.findOne as any).mockImplementation(() => ({ select: () => ({ exec: async () => ({ bank: 0 }) }), exec: async () => ({ bank: 0 }) }));
    (UserModel.findOneAndUpdate as any).mockImplementation(() => ({ exec: async () => null }));
    const i = makeInteraction('100000');
    await (withdrawCmd as any).run({ interaction: i });
    expect(i.reply).toHaveBeenCalled();
  });
});
