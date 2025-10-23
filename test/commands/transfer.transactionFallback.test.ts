import { describe, it, expect, vi, beforeEach } from 'vitest';

import TransferCommand from '../../src/Commands/Fun/transfer';
import { UserModel } from '../../src/Database/Schemas/userModel';

describe('transfer command transaction fallback', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('uses fallback path when startSession is not available', async () => {
    // Simulate no session support by temporarily removing startSession
    const origStart = (UserModel.db as any).startSession;
    (UserModel.db as any).startSession = undefined;

    try {
      const senderDoc = { balance: 100 };
      const findOneAndUpdate = vi.spyOn(UserModel, 'findOneAndUpdate') as any;

      // First call simulates decrement (succeeds)
      findOneAndUpdate.mockImplementationOnce(() => ({ exec: () => Promise.resolve(senderDoc) }));
      // Second call simulates increment for recipient
      findOneAndUpdate.mockImplementationOnce(() => ({ exec: () => Promise.resolve({}) }));

      const interaction: any = {
        guild: { id: 'g1' },
        options: { getString: (n: string) => (n === 'user' ? 'target' : '10') },
        user: { id: 'user1' },
        reply: vi.fn().mockResolvedValue(undefined),
      };

      await (TransferCommand as any).run({ interaction });

      expect(findOneAndUpdate).toHaveBeenCalled();
      expect(interaction.reply).toHaveBeenCalledWith({ content: `Transferred 10 gold to <@target>.` });
    } finally {
      // restore
      (UserModel.db as any).startSession = origStart;
    }
  });

  it('replies insufficient funds when guarded update fails', async () => {
    const origStart = (UserModel.db as any).startSession;
    (UserModel.db as any).startSession = undefined;
    const findOneAndUpdate = vi.spyOn(UserModel, 'findOneAndUpdate') as any;
    // Simulate sender not having enough balance
    findOneAndUpdate.mockImplementationOnce(() => ({ exec: () => Promise.resolve(null) }));

    const interaction: any = {
      guild: { id: 'g1' },
      options: { getString: (n: string) => (n === 'user' ? 'target' : '10') },
      user: { id: 'user1' },
      reply: vi.fn().mockResolvedValue(undefined),
    };

    try {
      await (TransferCommand as any).run({ interaction });
      expect(interaction.reply).toHaveBeenCalledWith({ content: 'Insufficient funds.', ephemeral: true });
    } finally {
      (UserModel.db as any).startSession = origStart;
    }
  });
});
