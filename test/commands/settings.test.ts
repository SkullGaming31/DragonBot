import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CommandType } from '../../src/Typings/Command';

const mocks = vi.hoisted(() => ({ findOne: vi.fn(), update: vi.fn(), save: vi.fn(), created: vi.fn() }));
vi.mock('../../src/Database/Schemas/settingsDB', () => {
	class Settings {
		static findOne = mocks.findOne;
		static findOneAndUpdate = mocks.update;
		constructor(value: unknown) { mocks.created(value); }
		save = mocks.save;
	}
	return { default: Settings };
});

import command from '../../src/Commands/Moderator/Settings';

function makeInteraction() {
	return {
		inCachedGuild: () => true,
		guild: { id: '123' },
		options: {
			getChannel: (name: string) => name === 'punishmentchan' ? { id: '20' } : null,
			getRole: () => null,
			getBoolean: () => true,
		},
		reply: vi.fn().mockResolvedValue(undefined),
	};
}

describe('/settings punishment channel', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		mocks.save.mockResolvedValue(undefined);
		mocks.update.mockResolvedValue({});
	});

	it('stores the canonical field when creating settings', async () => {
		mocks.findOne.mockResolvedValue(null);
		const interaction = makeInteraction();
		await (command as CommandType).run({ interaction: interaction as never, client: {} as never, args: {} as never });
		expect(mocks.created).toHaveBeenCalledWith(expect.objectContaining({ punishmentChannel: '20' }));
		expect(mocks.save).toHaveBeenCalledOnce();
	});

	it('stores the canonical field when updating settings', async () => {
		mocks.findOne.mockResolvedValue({});
		const interaction = makeInteraction();
		await (command as CommandType).run({ interaction: interaction as never, client: {} as never, args: {} as never });
		expect(mocks.update).toHaveBeenCalledWith(
			{ GuildID: '123' }, expect.objectContaining({ punishmentChannel: '20' }), expect.any(Object)
		);
	});
});
