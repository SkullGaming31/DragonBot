import { Message } from 'discord.js';

export type ReactResult = 'ok' | 'missing_permissions' | 'failed';

/**
 * Try to react to a message with retries and exponential backoff.
 * Accepts an unknown message-like object and narrows it before calling .react.
 */
export async function tryReact(messageLike: unknown, emoji: string, attempts = 3): Promise<ReactResult> {
  const base = 200; // ms
  const msg = messageLike as Message | undefined;
  if (!msg || typeof (msg as unknown as { react?: unknown }).react !== 'function') return 'failed';

  for (let i = 0; i < attempts; i++) {
    try {
      await msg.react(emoji);
      return 'ok';
    } catch (err: unknown) {
      // DiscordAPIError has a code for Missing Permissions (50013).
      // Only treat explicit code 50013 as missing permissions; other DiscordAPIError shapes (e.g., 429 rate-limit) should be retried.
      const code = (err as Record<string, unknown>)['code'] as number | undefined;
      if (code === 50013) {
        return 'missing_permissions';
      }

      if (i === attempts - 1) return 'failed';
      await new Promise((res) => setTimeout(res, base * Math.pow(2, i)));
    }
  }
  return 'failed';
}

export default { tryReact };
