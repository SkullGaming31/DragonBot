
import { CommandInteraction, Interaction } from 'discord.js';

// Map to store cooldowns for commands
export const cooldowns = new Map<string, Map<string, number>>(); // Key: command name, Sub-key: user ID, Value: cooldown end timestamp (ms)

function isNumber(value: number | boolean): value is number {
	return typeof value === 'number';
}

/**
 * Check if a user is on cooldown for a specific command.
 * @param commandName The name of the command to check cooldown for.
 * @param userId The ID of the user to check cooldown for.
 */
export function isOnCooldown(commandName: string, userId: string): boolean {
	const Cooldown = cooldowns.get(commandName)?.get(userId) ?? false;
	return isNumber(Cooldown) && Cooldown > Date.now();
}

export function setCooldown(commandName: string, userId: string, Cooldown: number): void {
	const commandCooldowns = cooldowns.get(commandName) || new Map<string, number>();
	commandCooldowns.set(userId, Date.now() + Cooldown);
	cooldowns.set(commandName, commandCooldowns);
}

// Safely reply to an interaction: tries reply/editReply/followUp and catches known Discord errors
export type ReplyableInteraction = {
	replied?: boolean;
	deferred?: boolean;
	channel?: { send?: (content: string) => Promise<unknown> | unknown } | null;
	reply?: (options?: unknown) => Promise<unknown>;
	editReply?: (options?: unknown) => Promise<unknown>;
	followUp?: (options?: unknown) => Promise<unknown>;
};

// _args name is intentionally unused in type-level callable signatures


type AsyncCallable = (...args: unknown[]) => Promise<unknown> | unknown;

export async function safeInteractionReply(
	interaction: CommandInteraction | Interaction | ReplyableInteraction,
	options: unknown
) {
	const replyOpts = typeof options === 'string' ? { content: options, ephemeral: true } : options;

	try {
		// prefer interaction.reply when available and not already replied/deferred
		if ('reply' in interaction && typeof (interaction as unknown as Record<string, unknown>)['reply'] === 'function') {
			const replied = 'replied' in interaction ? Boolean((interaction as unknown as Record<string, unknown>)['replied']) : false;
			const deferred = 'deferred' in interaction ? Boolean((interaction as unknown as Record<string, unknown>)['deferred']) : false;
			if (!replied && !deferred) {
				const replyFn = (interaction as unknown as { reply?: AsyncCallable }).reply;
				if (replyFn) return await replyFn.call(interaction, replyOpts);
			}
		}

		if ('deferred' in interaction && Boolean((interaction as unknown as Record<string, unknown>)['deferred']) && 'editReply' in interaction && typeof (interaction as unknown as Record<string, unknown>)['editReply'] === 'function') {
			const editFn = (interaction as unknown as { editReply?: AsyncCallable }).editReply;
			if (editFn) return await editFn.call(interaction, replyOpts);
		}

		if ('followUp' in interaction && typeof (interaction as unknown as Record<string, unknown>)['followUp'] === 'function') {
			const followFn = (interaction as unknown as { followUp?: AsyncCallable }).followUp;
			if (followFn) return await followFn.call(interaction, replyOpts);
		}

		// Last resort: send to channel if present
		const channel = (interaction as unknown as { channel?: unknown }).channel;
		if (channel && typeof (channel as Record<string, unknown>)['send'] === 'function') {
			let content = '';
			if (typeof replyOpts === 'string') content = replyOpts;
			else if (replyOpts && typeof replyOpts === 'object' && 'content' in (replyOpts as Record<string, unknown>) && typeof (replyOpts as Record<string, unknown>)['content'] === 'string') {
				content = (replyOpts as Record<string, unknown>)['content'] as string;
			}
			const sendFn = (channel as unknown as { send?: AsyncCallable }).send;
			if (sendFn) return await sendFn.call(channel, content);
		}
	} catch (err) {
		const e = err as unknown as { code?: number; message?: string };
		const code = e?.code;
		// Ignore unknown interaction / already acknowledged
		if (code === 10062 || code === 40060) {
			console.warn('Ignored interaction API error', code, e?.message);
			return;
		}

		// Fallback: try to send message to channel
		try {
			const channel = (interaction as unknown as { channel?: unknown }).channel;
			if (channel && typeof (channel as Record<string, unknown>)['send'] === 'function') {
				let content = '';
				if (typeof options === 'string') content = options;
				else if (options && typeof options === 'object' && 'content' in (options as Record<string, unknown>) && typeof (options as Record<string, unknown>)['content'] === 'string') {
					content = (options as Record<string, unknown>)['content'] as string;
				}
				const sendFn = (channel as unknown as { send?: AsyncCallable }).send;
				if (sendFn) await sendFn.call(channel, content);
			}
		} catch {
			// ignore fallback failures
		}
	}
}