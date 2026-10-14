import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChannelType } from 'discord.js';

vi.mock('../src/Database/Schemas/userModel', () => ({
	UserModel: {
		findOne: vi.fn(async () => null),
		findOneAndUpdate: vi.fn()
	}
}));

vi.mock('../src/Database/Schemas/settingsDB', () => ({
	default: { findOne: vi.fn(async () => null) }
}));

vi.mock('../src/Database/Schemas/ticketDB', () => ({
	default: { findOne: vi.fn() }
}));

vi.mock('../src/Database/Schemas/ticketSetupDB', () => ({
	default: { findOne: vi.fn() }
}));

import { UserModel } from '../src/Database/Schemas/userModel';
import economyEvent from '../src/Events/customMessage/economy';

describe('message economy event', () => {
	afterEach(() => vi.restoreAllMocks());

	it('reads the user without calling findOneAndUpdate before deciding on a reward', async () => {
		vi.spyOn(Math, 'random').mockReturnValue(1);
		const message = {
			author: { bot: false, id: 'user1' },
			guild: { id: 'guild1' },
			channel: { type: ChannelType.GuildText, name: 'skull-chat' },
			member: { roles: { cache: [] } },
			content: 'a valid message'
		};

		await expect(economyEvent.run(message as never)).resolves.toBeUndefined();

		expect(UserModel.findOne).toHaveBeenCalledWith({ guildID: 'guild1', id: 'user1' });
		expect(UserModel.findOneAndUpdate).not.toHaveBeenCalled();
	});
});
