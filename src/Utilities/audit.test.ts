import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmbedBuilder, Guild, TextChannel, ChannelType } from 'discord.js';

// Hoisted mock for the LogsChannelDB module so the real Mongoose model isn't compiled in tests
const mockedFind = vi.fn();
vi.mock('../Database/Schemas/LogsChannelDB', () => ({ default: { findOne: mockedFind } }));

// We will import the helper dynamically inside tests to allow the above mock to be applied first
const auditPath = './audit';

// We'll import the real model per-test and spy on its findOne method.

// Helper to create a fake guild with minimal channel handling
function makeGuildMock(channelsCache: Map<string, unknown> = new Map(), fetchImpl?: (id: string) => Promise<unknown> | unknown) {
	const guild = {
		id: 'guild1',
		channels: {
			cache: channelsCache,
			fetch: fetchImpl ? (async (id: string) => fetchImpl(id)) : (async () => undefined),
		},
	} as unknown as Guild;
	return guild;
}

beforeEach(() => {
	vi.resetModules();
	vi.restoreAllMocks();
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('sendGuildLog', () => {
	it('returns false when no logs config is found', async () => {
		mockedFind.mockResolvedValueOnce(null);
		const { sendGuildLog } = await import(auditPath) as typeof import('./audit');
		const guild = makeGuildMock();
		const sent = await sendGuildLog(guild, new EmbedBuilder());
		expect(sent).toBe(false);
		expect(mockedFind).toHaveBeenCalledWith({ Guild: 'guild1' });
	});

	it('returns false when configured channel cannot be found', async () => {
		mockedFind.mockResolvedValueOnce({ Guild: 'guild1', Channel: 'chan1', enableLogs: true } as unknown as { Guild: string; Channel: string; enableLogs: boolean });

		const guild = makeGuildMock(new Map());
		const { sendGuildLog } = await import(auditPath) as typeof import('./audit');
		const sent = await sendGuildLog(guild, new EmbedBuilder());
		expect(sent).toBe(false);
		expect(mockedFind).toHaveBeenCalled();
	});

	it('returns false when configured channel exists but is not a text channel', async () => {
		mockedFind.mockResolvedValueOnce({ Guild: 'guild1', Channel: 'chan1', enableLogs: true } as unknown as { Guild: string; Channel: string; enableLogs: boolean });

		// create a channel object with an incorrect type
		const fakeChannel: unknown = { id: 'chan1', type: ChannelType.GuildVoice };
		const guild = makeGuildMock(new Map([['chan1', fakeChannel]]), async (id: string) => fakeChannel);

		const { sendGuildLog } = await import(auditPath) as typeof import('./audit');
		const sent = await sendGuildLog(guild, new EmbedBuilder());
		expect(sent).toBe(false);
		expect(mockedFind).toHaveBeenCalled();
	});

	it('sends embed when configured channel is a text channel', async () => {
		mockedFind.mockResolvedValueOnce({ Guild: 'guild1', Channel: 'chan1', enableLogs: true } as unknown as { Guild: string; Channel: string; enableLogs: boolean });

		let sentEmbed: unknown = null;
		const sendMock = vi.fn().mockImplementation(async ({ embeds }: { embeds?: unknown[] }) => { sentEmbed = embeds?.[0]; return {}; });
		const fakeTextChannel = {
			id: 'chan1',
			type: ChannelType.GuildText,
			send: sendMock,
		} as unknown as TextChannel;

		const guild = makeGuildMock(new Map([['chan1', fakeTextChannel]]), async (id: string) => fakeTextChannel);

		const { sendGuildLog } = await import(auditPath) as typeof import('./audit');
		const embed = new EmbedBuilder().setTitle('test');
		const sent = await sendGuildLog(guild, embed);
		expect(sent).toBe(true);
		expect(sendMock).toHaveBeenCalled();
		expect(sentEmbed).toBeDefined();
		// Access embed title in a type-safe way via unknown narrowing
		expect(sentEmbed).toBeDefined();
		if (sentEmbed && typeof sentEmbed === 'object' && 'data' in (sentEmbed as Record<string, unknown>)) {
			const data = (sentEmbed as Record<string, unknown>).data as unknown;
			if (data && typeof data === 'object' && 'title' in (data as Record<string, unknown>)) {
				expect((data as Record<string, unknown>).title).toBe('test');
			} else {
				// Fail the test if structure is not as expected
				expect(false).toBe(true);
			}
		} else {
			// Fail the test if sentEmbed is not an object
			expect(false).toBe(true);
		}
		expect(mockedFind).toHaveBeenCalled();
	});
});
