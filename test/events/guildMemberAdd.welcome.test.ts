import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelType, EmbedBuilder } from 'discord.js';

const mocks = vi.hoisted(() => ({ settings: vi.fn(), warnings: vi.fn(), send: vi.fn() }));
vi.mock('../../src/Database/Schemas/settingsDB', () => ({ default: { findOne: mocks.settings } }));
vi.mock('../../src/Database/Schemas/WarnDB', () => ({ default: { findOne: mocks.warnings } }));
vi.mock('../../src/Utilities/logger', () => ({ error: vi.fn(), info: vi.fn() }));

import welcomeEvent from '../../src/Events/Logs/guildMemberAdd';

const member = {
	id: '123',
	toString: () => '<@123>',
	user: { id: '123', globalName: 'Member', createdTimestamp: 1000, displayAvatarURL: () => 'https://example.com/avatar.png' },
	guild: {
		id: '456',
		name: 'Test Guild',
		ownerId: 'owner',
		memberCount: 5,
		rulesChannel: null,
		rulesChannelId: null,
		iconURL: () => null,
		channels: { cache: { get: () => ({ type: ChannelType.GuildText, send: mocks.send }) } }
	}
};

describe('member welcome messages', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.warnings.mockReturnValue({ lean: () => Promise.resolve(null) });
		mocks.send.mockResolvedValue(undefined);
	});

	it('sends the configured message in the embed and mentions the new member', async () => {
		mocks.settings.mockResolvedValue({ Welcome: true, WelcomeChannel: '789', WelcomeMessage: 'Welcome aboard!' });
		await welcomeEvent.run(member as never);
		expect(mocks.send).toHaveBeenCalledOnce();
		const payload = mocks.send.mock.calls[0][0] as { content: string; embeds: EmbedBuilder[] };
		expect(payload.content).toBe('Welcome <@123>');
		expect(payload.embeds[0].toJSON().description).toBe('Welcome aboard!');
	});

	it.each([null, '', '   '])('preserves the default message for an empty setting (%s)', async (message) => {
		mocks.settings.mockResolvedValue({ Welcome: true, WelcomeChannel: '789', WelcomeMessage: message });
		await welcomeEvent.run(member as never);
		const payload = mocks.send.mock.calls[0][0] as { embeds: EmbedBuilder[] };
		expect(payload.embeds[0].toJSON().description).toBe("Welcome to Test Guild's server!");
	});

	it('does not send a welcome message when the feature is disabled', async () => {
		mocks.settings.mockResolvedValue({ Welcome: false, WelcomeChannel: '789', WelcomeMessage: 'Welcome aboard!' });
		await welcomeEvent.run(member as never);
		expect(mocks.send).not.toHaveBeenCalled();
	});
});
