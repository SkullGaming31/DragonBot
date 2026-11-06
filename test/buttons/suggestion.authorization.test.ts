import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SuggestionModel from '../../src/Database/Schemas/SuggestDB';
import accept from '../../src/Buttons/suggesAccept';
import decline from '../../src/Buttons/suggesDecline';

vi.mock('../../src/Utilities/logger', () => ({ error: vi.fn() }));

describe.each([['accept', accept], ['decline', decline]] as const)('suggestion %s', (_name, handler) => {
	afterEach(() => vi.restoreAllMocks());

	function interaction(allowed: boolean) {
		return {
			guild: { id: 'guild' },
			memberPermissions: new PermissionsBitField(allowed ? ['ManageMessages'] : []),
			message: {
				id: 'message',
				embeds: [new EmbedBuilder().setTitle('Suggestion').addFields({ name: 'Status', value: 'Pending' }).toJSON()],
				edit: vi.fn().mockResolvedValue(undefined),
			},
			reply: vi.fn().mockResolvedValue(undefined),
		};
	}

	it('rejects users without Manage Messages before accessing the database', async () => {
		const find = vi.spyOn(SuggestionModel, 'findOne');
		const request = interaction(false);
		await handler.run({ interaction: request } as never);
		expect(find).not.toHaveBeenCalled();
		expect(request.message.edit).not.toHaveBeenCalled();
		expect(request.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Manage Messages') }));
	});

	it('allows moderators to make a decision', async () => {
		vi.spyOn(SuggestionModel, 'findOne').mockResolvedValue({} as never);
		const remove = vi.spyOn(SuggestionModel, 'deleteOne').mockResolvedValue({} as never);
		const request = interaction(true);
		await handler.run({ interaction: request } as never);
		expect(request.message.edit).toHaveBeenCalledOnce();
		expect(remove).toHaveBeenCalledWith({ guildId: 'guild', messageId: 'message' });
	});

	it('does not remove the record when editing the message fails', async () => {
		vi.spyOn(SuggestionModel, 'findOne').mockResolvedValue({} as never);
		const remove = vi.spyOn(SuggestionModel, 'deleteOne');
		const request = interaction(true);
		request.message.edit.mockRejectedValue(new Error('edit failed'));
		await handler.run({ interaction: request } as never);
		expect(remove).not.toHaveBeenCalled();
		expect(request.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Could not fully process') }));
	});
});
