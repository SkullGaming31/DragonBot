import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/Database/Schemas/userModel', () => ({
	UserModel: {
		updateOne: vi.fn(),
		findOne: vi.fn(),
	}
}));

vi.mock('../../src/Utilities/logger', () => ({
	error: vi.fn(),
}));

import { UserModel } from '../../src/Database/Schemas/userModel';
import { error as logError } from '../../src/Utilities/logger';
import userMentionEvent from '../../src/Events/customMessage/userMention';

function makeMessage(options: { guild?: boolean; bot?: boolean; mentioned?: { id: string; username: string } } = {}) {
	const mentioned = options.mentioned;
	return {
		inGuild: () => options.guild !== false,
		guild: options.guild === false ? null : { id: 'guild1' },
		author: { id: 'author1', bot: options.bot ?? false },
		mentions: { users: { size: mentioned ? 1 : 0, first: () => mentioned } },
		reply: vi.fn().mockResolvedValue(undefined),
	};
}

describe('AFK message event', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(UserModel.updateOne).mockResolvedValue({ acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedCount: 0, upsertedId: null });
	});

	it("clears only the author's AFK fields in the current guild even without mentions", async () => {
		const message = makeMessage();

		await userMentionEvent.run(message as never);

		expect(UserModel.updateOne).toHaveBeenCalledWith(
			{ guildID: 'guild1', id: 'author1', AFKmessage: { $type: 'string', $ne: '' } },
			{ $set: { AFKmessage: '', AFKstatus: null } }
		);
		expect(UserModel.findOne).not.toHaveBeenCalled();
		expect(message.reply).not.toHaveBeenCalled();
	});

	it('ignores bots and direct messages', async () => {
		await userMentionEvent.run(makeMessage({ bot: true }) as never);
		await userMentionEvent.run(makeMessage({ guild: false }) as never);

		expect(UserModel.updateOne).not.toHaveBeenCalled();
		expect(UserModel.findOne).not.toHaveBeenCalled();
	});

	it('still replies when the returning user mentions someone who is AFK', async () => {
		vi.mocked(UserModel.findOne).mockResolvedValue({ AFKmessage: 'Away' });
		const message = makeMessage({ mentioned: { id: 'user2', username: 'other' } });

		await userMentionEvent.run(message as never);

		expect(UserModel.findOne).toHaveBeenCalledWith({ guildID: 'guild1', id: 'user2' });
		expect(message.reply).toHaveBeenCalledWith({ content: '<@author1>, **other** is currently AFK: `Away`' });
	});

	it('does not reply to a mention without an AFK message', async () => {
		vi.mocked(UserModel.findOne).mockResolvedValue(null);
		const message = makeMessage({ mentioned: { id: 'user2', username: 'other' } });

		await userMentionEvent.run(message as never);

		expect(message.reply).not.toHaveBeenCalled();
	});

	it('logs a failed clear and still handles mentions', async () => {
		vi.mocked(UserModel.updateOne).mockRejectedValue(new Error('database unavailable'));
		vi.mocked(UserModel.findOne).mockResolvedValue({ AFKmessage: 'Away' });
		const message = makeMessage({ mentioned: { id: 'user2', username: 'other' } });

		await userMentionEvent.run(message as never);

		expect(logError).toHaveBeenCalledWith('Error clearing AFK message', { error: 'database unavailable', user: 'author1', guild: 'guild1' });
		expect(message.reply).toHaveBeenCalled();
	});

	it('logs failures while looking up an AFK mention', async () => {
		vi.mocked(UserModel.findOne).mockRejectedValue(new Error('lookup failed'));

		await userMentionEvent.run(makeMessage({ mentioned: { id: 'user2', username: 'other' } }) as never);

		expect(logError).toHaveBeenCalledWith('Error handling AFK mention', { error: 'lookup failed' });
	});
});
