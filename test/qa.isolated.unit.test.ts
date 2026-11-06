import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ commands: new Map<string, any>(), buttons: new Map<string, any>() }));
vi.mock('../src/index', () => ({ appInstance: { client: { commands: mocks.commands, buttons: mocks.buttons } } }));
vi.mock('../src/Utilities/logger', () => ({ error: vi.fn(), debug: vi.fn(), info: vi.fn(), warn: vi.fn() }));
vi.mock('axios', () => ({ default: { post: vi.fn() } }));

import event from '../src/Events/Interaction/interactionCreate';
import { cooldowns, isOnCooldown } from '../src/Utilities/functions';
import { escalateByWarnings } from '../src/Utilities/moderation';
import roulette from '../src/Commands/Fun/roulette';
import SettingsModel from '../src/Database/Schemas/settingsDB';
import { UserModel } from '../src/Database/Schemas/userModel';
import SuggestionModel from '../src/Database/Schemas/SuggestDB';
import acceptSuggestion from '../src/Buttons/suggesAccept';
import ticketResponse from '../src/Events/Tickets/ticketResponse';
import TicketSetup from '../src/Database/Schemas/ticketSetupDB';
import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import { createHmac } from 'node:crypto';
import TwitchAdapter from '../src/Integrations/twitchAdapter';
import RouletteModel from '../src/Database/Schemas/rouletteDB';

describe('isolated adversarial characterization', () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllEnvs();
		vi.useRealTimers();
		mocks.commands.clear();
		cooldowns.clear();
	});

	it('runs a command twice while its recorded cooldown is active', async () => {
		const run = vi.fn().mockResolvedValue(undefined);
		mocks.commands.set('example', { run, Cooldown: 60000 });
		const interaction = { user: { id: 'u' }, commandName: 'example', options: {},
			isChatInputCommand: () => true, isButton: () => false };
		await event.run(interaction as never);
		expect(isOnCooldown('example', 'u')).toBe(true);
		await event.run(interaction as never);
		expect(run).toHaveBeenCalledTimes(2);
	});

	it('reports a timeout as applied after Discord rejects it', async () => {
		vi.stubEnv('AUTOMOD_TEST_USER_IDS', '');
		vi.stubEnv('AUTOMOD_DASHBOARD_URL', '');
		const member = { id: 'u', moderatable: true, timeout: vi.fn().mockRejectedValue(new Error('denied')) };
		expect(await escalateByWarnings(member as never, { id: 'g', ownerId: 'owner' } as never, 1)).toBe('timeout');
		expect(member.timeout).toHaveBeenCalledOnce();
	});

	it('roulette queries by invoking user id rather than username', async () => {
		vi.spyOn(SettingsModel, 'findOne').mockResolvedValue({ EconChan: 'ch' } as never);
		const findUser = vi.spyOn(UserModel, 'findOne').mockResolvedValue({ id: 'victim', balance: 0 } as never);
		const interaction = { user: { id: 'attacker', username: 'former-victim-name' },
			guild: { id: 'g', channels: { cache: new Map([['ch', { id: 'ch' }]]) } },
			channel: { id: 'ch' }, options: { getInteger: () => 100 }, reply: vi.fn() };
		await roulette.run({ interaction } as never);
		expect(findUser).toHaveBeenCalledWith({ guildID: 'g', id: 'attacker' });
		expect(interaction.reply.mock.calls[0][0].content).toContain('Insufficient funds');
	});

	it('roulette changes and saves the invoking user document', async () => {
		vi.useFakeTimers();
		vi.spyOn(Math, 'random').mockReturnValue(0.5);
		vi.spyOn(SettingsModel, 'findOne').mockResolvedValue({ EconChan: 'ch' } as never);
		const player = { id: 'attacker', balance: 1000, save: vi.fn().mockResolvedValue(undefined) };
		const lookup = vi.spyOn(UserModel, 'findOne').mockResolvedValue(player as never);
		vi.spyOn(RouletteModel, 'findOne').mockResolvedValue({ jackpot: 0, streak: 0, save: vi.fn() } as never);
		const interaction = { user: { id: 'attacker', username: 'former-victim-name' },
			guild: { id: 'g', channels: { cache: new Map([['ch', { id: 'ch' }]]) } },
			channel: { id: 'ch' }, options: { getInteger: () => 100 },
			reply: vi.fn(), deferReply: vi.fn(), editReply: vi.fn() };
		const running = roulette.run({ interaction } as never);
		await vi.advanceTimersByTimeAsync(4000);
		await running;
		expect(lookup).toHaveBeenCalledWith({ guildID: 'g', id: 'attacker' });
		expect(player.balance).not.toBe(1000);
		expect(player.save).toHaveBeenCalledOnce();
	});

	it('does not exempt the former built-in test account', async () => {
		vi.stubEnv('AUTOMOD_TEST_USER_IDS', undefined);
		vi.stubEnv('AUTOMOD_TEST_USER_ID', undefined);
		vi.stubEnv('AUTOMOD_DASHBOARD_URL', '');
		const member = { id: '353674019943219204', bannable: true, ban: vi.fn().mockResolvedValue(undefined) };
		expect(await escalateByWarnings(member as never, { id: 'g', ownerId: 'owner' } as never, 3)).toBe('ban');
		expect(member.ban).toHaveBeenCalledOnce();
	});

	it('rejects a suggestion decision without member permissions', async () => {
		vi.spyOn(SuggestionModel, 'findOne').mockResolvedValue({} as never);
		const remove = vi.spyOn(SuggestionModel, 'deleteOne').mockResolvedValue({} as never);
		const message = { id: 'm', embeds: [new EmbedBuilder().setTitle('Suggestion').addFields(
			{ name: 'Status', value: 'Pending' },
		).toJSON()], edit: vi.fn().mockResolvedValue(undefined) };
		const interaction = { guild: { id: 'g' }, message, user: { id: 'ordinary-member' }, reply: vi.fn() };
		await acceptSuggestion.run({ interaction } as never);
		expect(message.edit).not.toHaveBeenCalled();
		expect(remove).not.toHaveBeenCalled();
		expect(interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Manage Messages') }));
	});

	it('denies a moderator who has the configured hard-coded role but not administrator permission', async () => {
		vi.spyOn(TicketSetup, 'findOne').mockResolvedValue({} as never);
		const reply = vi.fn().mockResolvedValue(undefined);
		const interaction = { isButton: () => true, inCachedGuild: () => true, guild: { id: 'g' },
			customId: 'claim', channel: { id: 'ch' }, member: {
				id: 'mod', roles: { cache: new Map([['959693430227894300', {}]]) },
				permissions: new PermissionsBitField(['ManageMessages']),
			}, reply };
		await ticketResponse.run(interaction as never);
		expect(reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('you must have') }));
	});

	it('accepts a correctly signed Twitch request with a years-old timestamp', () => {
		vi.stubEnv('TWITCH_EVENTSUB_SECRET', 'qa-local-only');
		const id = 'old-event';
		const timestamp = '2020-01-01T00:00:00Z';
		const body = Buffer.from('{"event":{}}');
		const signature = createHmac('sha256', 'qa-local-only').update(id + timestamp).update(body).digest('hex');
		expect(TwitchAdapter.validate!({
			'twitch-eventsub-message-id': id,
			'twitch-eventsub-message-timestamp': timestamp,
			'twitch-eventsub-message-signature': `sha256=${signature}`,
		}, body)).toBe(true);
	});
});
