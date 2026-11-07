import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessageFlags } from 'discord.js';

const mocks = vi.hoisted(() => ({
	commands: new Map<string, any>(),
	buttons: new Map<string, any>(),
	setCooldown: vi.fn(),
	safeReply: vi.fn(),
	record: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	economyDisabled: vi.fn(),
}));

vi.mock('../../src/index', () => ({ appInstance: { client: { commands: mocks.commands, buttons: mocks.buttons } } }));
vi.mock('../../src/Utilities/functions', () => ({ setCooldown: mocks.setCooldown, safeInteractionReply: mocks.safeReply }));
vi.mock('../../src/Utilities/metricsReporter', () => ({ recordCommandTimestamp: mocks.record }));
vi.mock('../../src/Utilities/logger', () => ({ error: mocks.error, warn: mocks.warn }));
vi.mock('../../src/Utilities/economyCommands', () => ({
	economyCommands: new Set(['daily']),
	economyCommandDisabled: mocks.economyDisabled,
}));

import event from '../../src/Events/Interaction/interactionCreate';

function interaction(overrides: Record<string, unknown> = {}) {
	return {
		user: { id: 'user1' },
		commandName: 'example',
		options: {},
		customId: 'button1',
		isChatInputCommand: () => true,
		isButton: () => false,
		deferred: false,
		replied: false,
		reply: vi.fn().mockResolvedValue(undefined),
		editReply: vi.fn().mockResolvedValue(undefined),
		...overrides,
	};
}

describe('interaction dispatcher', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.commands.clear();
		mocks.buttons.clear();
	});

	it('rejects unknown commands privately', async () => {
		const i = interaction();
		await event.run(i as never);
		expect(i.reply).toHaveBeenCalledWith({ content: 'You have used a non-existent command, please try another command', flags: MessageFlags.Ephemeral });
		expect(mocks.record).not.toHaveBeenCalled();
	});

	it('runs commands and records metrics and cooldown only after success', async () => {
		const run = vi.fn().mockResolvedValue(undefined);
		mocks.commands.set('example', { run, Category: 'Fun', Cooldown: 30 });
		const i = interaction();
		await event.run(i as never);
		expect(run).toHaveBeenCalledWith(expect.objectContaining({ interaction: i, args: i.options }));
		expect(mocks.record).toHaveBeenCalledWith('example', 'Fun');
		expect(mocks.setCooldown).toHaveBeenCalledWith('example', 'user1', 30);
	});

	it('blocks disabled economy commands without running or recording them', async () => {
		const run = vi.fn();
		mocks.commands.set('daily', { run, Category: 'Fun' });
		mocks.economyDisabled.mockResolvedValueOnce(true);
		const i = interaction({ commandName: 'daily', guildId: 'guild1' });
		await event.run(i as never);
		expect(mocks.economyDisabled).toHaveBeenCalledWith('guild1', 'daily');
		expect(mocks.safeReply).toHaveBeenCalledWith(i, expect.objectContaining({ flags: MessageFlags.Ephemeral }));
		expect(run).not.toHaveBeenCalled();
		expect(mocks.record).not.toHaveBeenCalled();
	});

	it('runs enabled economy commands and rejects direct messages', async () => {
		const run = vi.fn().mockResolvedValue(undefined);
		mocks.commands.set('daily', { run });
		mocks.economyDisabled.mockResolvedValueOnce(false);
		await event.run(interaction({ commandName: 'daily', guildId: 'guild1' }) as never);
		await event.run(interaction({ commandName: 'daily', guildId: null }) as never);
		expect(run).toHaveBeenCalledTimes(1);
		expect(mocks.safeReply).toHaveBeenCalledTimes(1);
	});

	it('does not apply economy settings to the moderation command editpoints', async () => {
		const run = vi.fn().mockResolvedValue(undefined);
		mocks.commands.set('editpoints', { run });
		await event.run(interaction({ commandName: 'editpoints', guildId: 'guild1' }) as never);
		expect(run).toHaveBeenCalledOnce();
		expect(mocks.economyDisabled).not.toHaveBeenCalled();
	});

	it('fails closed when economy settings cannot be read', async () => {
		const run = vi.fn();
		mocks.commands.set('daily', { run });
		mocks.economyDisabled.mockRejectedValueOnce(new Error('database unavailable'));
		const i = interaction({ commandName: 'daily', guildId: 'guild1' });
		await event.run(i as never);
		expect(run).not.toHaveBeenCalled();
		expect(i.reply).toHaveBeenCalledWith(expect.objectContaining({ content: 'An internal error occurred while executing this command.' }));
	});

	it.each([
		{ deferred: false, replied: false, method: 'reply' },
		{ deferred: true, replied: false, method: 'editReply' },
		{ deferred: false, replied: true, method: 'none' },
	])('handles command failure when deferred=$deferred and replied=$replied', async ({ deferred, replied, method }) => {
		mocks.commands.set('example', { run: vi.fn().mockRejectedValue(new Error('failed')), Cooldown: 30 });
		const i = interaction({ deferred, replied });
		await event.run(i as never);
		expect(mocks.record).not.toHaveBeenCalled();
		expect(mocks.setCooldown).not.toHaveBeenCalled();
		if (method === 'reply') expect(i.reply).toHaveBeenCalledWith({ content: 'An internal error occurred while executing this command.', flags: MessageFlags.Ephemeral });
		else expect(i.reply).not.toHaveBeenCalled();
		if (method === 'editReply') expect(i.editReply).toHaveBeenCalledWith({ content: 'An internal error occurred while executing this command.' });
		else expect(i.editReply).not.toHaveBeenCalled();
	});

	it('dispatches registered buttons and ignores unknown buttons', async () => {
		const run = vi.fn().mockResolvedValue(undefined);
		mocks.buttons.set('button1', { run });
		const i = interaction({ isChatInputCommand: () => false, isButton: () => true });
		await event.run(i as never);
		expect(run).toHaveBeenCalledWith(expect.objectContaining({ interaction: i }));
		mocks.buttons.clear();
		await event.run(i as never);
		expect(run).toHaveBeenCalledTimes(1);
	});

	it.each([10062, 40060])('ignores expired or acknowledged button errors (%i)', async (code) => {
		mocks.buttons.set('button1', { run: vi.fn().mockRejectedValue({ code }) });
		await event.run(interaction({ isChatInputCommand: () => false, isButton: () => true }) as never);
		expect(mocks.safeReply).not.toHaveBeenCalled();
		expect(mocks.warn).toHaveBeenCalled();
	});

	it('sends a safe private error for other button failures', async () => {
		mocks.buttons.set('button1', { run: vi.fn().mockRejectedValue(new Error('failed')) });
		const i = interaction({ isChatInputCommand: () => false, isButton: () => true });
		await event.run(i as never);
		expect(mocks.safeReply).toHaveBeenCalledWith(i, { content: 'An error occurred while processing your request. Please try again later.', flags: MessageFlags.Ephemeral });
	});
});
