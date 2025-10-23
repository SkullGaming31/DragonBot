import { beforeEach, describe, it, expect, vi } from 'vitest';
import { cooldowns, setCooldown, isOnCooldown, safeInteractionReply } from '../src/Utilities/functions';

beforeEach(() => {
  cooldowns.clear();
});

describe('cooldown utilities', () => {
  it('setCooldown should add a cooldown and isOnCooldown should return true immediately', () => {
    setCooldown('cmd1', 'user1', 1000);
    expect(isOnCooldown('cmd1', 'user1')).toBe(true);
  });

  it('isOnCooldown should return false for expired cooldowns', () => {
    const cmdMap = new Map<string, number>();
    // expired timestamp
    cmdMap.set('user2', Date.now() - 10000);
    cooldowns.set('cmd-expired', cmdMap);
    expect(isOnCooldown('cmd-expired', 'user2')).toBe(false);
  });
});

describe('safeInteractionReply', () => {
  it('calls reply when available', async () => {
    const reply = vi.fn(async (opts: unknown) => opts);
    const interaction: any = { reply };
    await safeInteractionReply(interaction, 'hello');
    expect(reply).toHaveBeenCalled();
  });

  it('calls editReply when deferred', async () => {
    const editReply = vi.fn(async (opts: unknown) => opts);
    const interaction: any = { deferred: true, editReply };
    await safeInteractionReply(interaction, { content: 'x' });
    expect(editReply).toHaveBeenCalled();
  });

  it('calls followUp when available', async () => {
    const followUp = vi.fn(async (opts: unknown) => opts);
    const interaction: any = { followUp };
    await safeInteractionReply(interaction, 'follow');
    expect(followUp).toHaveBeenCalled();
  });

  it('sends to channel when no interaction functions available', async () => {
    const send = vi.fn(async (c: unknown) => c);
    const interaction: any = { channel: { send } };
    await safeInteractionReply(interaction, 'payload');
    expect(send).toHaveBeenCalledWith('payload');
  });

  it('ignores known Discord interaction errors (10062, 40060) and does not throw', async () => {
    const reply = vi.fn(() => {
      const e: any = { code: 10062, message: 'ignored' };
      throw e;
    });
    const send = vi.fn();
    const interaction: any = { reply, channel: { send } };
    await expect(safeInteractionReply(interaction, 'x')).resolves.toBeUndefined();
    expect(send).not.toHaveBeenCalled();
  });
});
