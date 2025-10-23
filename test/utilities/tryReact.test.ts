import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tryReact } from '../../src/Utilities/retry';

describe('tryReact', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('returns ok when react succeeds on first try', async () => {
    const msg = { react: vi.fn().mockResolvedValue(true) } as any;
    const res = await tryReact(msg as unknown, '✅', 2);
    expect(res).toBe('ok');
    expect(msg.react).toHaveBeenCalledWith('✅');
  });

  it('retries then fails on persistent error', async () => {
    const err = new Error('boom');
    const msg = { react: vi.fn().mockRejectedValue(err) } as any;
    const res = await tryReact(msg as unknown, '✅', 2);
    expect(res).toBe('failed');
    expect(msg.react).toHaveBeenCalledTimes(2);
  });

  it('retries on transient errors then succeeds (rate-limit scenario)', async () => {
    vi.useFakeTimers();
    const calls: Array<() => Promise<unknown>> = [];
    const transient = new Error('429 Too Many Requests');
    const msg: any = { react: vi.fn() };
    // first two calls reject, third resolves
    msg.react.mockImplementationOnce(() => Promise.reject(transient));
    msg.react.mockImplementationOnce(() => Promise.reject(transient));
    msg.react.mockImplementationOnce(() => Promise.resolve(true));

    const p = tryReact(msg as unknown, '✅', 4);

    // advance timers to allow retries to run through backoff
    // base=200, backoffs: 200, 400 -> advance a bit more than total
    await vi.advanceTimersByTimeAsync(700);

    const res = await p;
    expect(res).toBe('ok');
    expect(msg.react).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it('treats 429-shaped errors as transient and retries', async () => {
    vi.useFakeTimers();
    const rateErr: any = new Error('Rate limited');
    rateErr.httpStatus = 429;
    rateErr.name = 'DiscordAPIError';

    const msg: any = { react: vi.fn() };
    // first call rejects with rate limit, second call resolves
    msg.react.mockImplementationOnce(() => Promise.reject(rateErr));
    msg.react.mockImplementationOnce(() => Promise.resolve(true));

    const p = tryReact(msg as unknown, '🔥', 3);
    // advance timers past backoff
    await vi.advanceTimersByTimeAsync(300);
    const res = await p;
    expect(res).toBe('ok');
    expect(msg.react).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('returns missing_permissions when DiscordAPIError with code 50013 is thrown', async () => {
    const discordErr: any = new Error('Missing Permissions');
    discordErr.code = 50013;
    discordErr.name = 'DiscordAPIError';
    const msg = { react: vi.fn().mockRejectedValue(discordErr) } as any;
    const res = await tryReact(msg as unknown, '✅', 3);
    expect(res).toBe('missing_permissions');
    expect(msg.react).toHaveBeenCalledTimes(1);
  });
});
