import { afterEach, describe, expect, it, vi } from 'vitest';
import { MessageFlags } from 'discord.js';
import afkCommand from '../../src/Commands/Information/afk';
import { UserModel } from '../../src/Database/Schemas/userModel';
import { CommandType } from '../../src/Typings/Command';

const command = afkCommand as CommandType;

function makeInteraction() {
	return {
		options: { getString: vi.fn().mockReturnValue('Away') },
		user: { id: 'user1' },
		guild: { id: 'guild1', members: { fetch: vi.fn() } },
		client: { user: { setPresence: vi.fn() } },
		reply: vi.fn().mockResolvedValue(undefined),
	};
}

describe('AFK command', () => {
	afterEach(() => vi.restoreAllMocks());

	it('only exposes the AFK message option', () => {
		expect(command.options?.map(option => option.name)).toEqual(['message']);
	});

	it('updates an existing user without changing presence', async () => {
		const user = new UserModel({ guildID: 'guild1', id: 'user1', AFKmessage: 'Old', AFKstatus: 'idle', balance: 100 });
		const save = vi.spyOn(user, 'save').mockResolvedValue(user);
		vi.spyOn(UserModel, 'findOne').mockResolvedValue(user);
		const interaction = makeInteraction();

		await command.run({ interaction } as never);

		expect(interaction.options.getString).toHaveBeenCalledOnce();
		expect(interaction.options.getString).toHaveBeenCalledWith('message');
		expect(user).toMatchObject({ AFKmessage: 'Away', AFKstatus: null, balance: 100 });
		expect(save).toHaveBeenCalledOnce();
		expect(interaction.client.user.setPresence).not.toHaveBeenCalled();
		expect(interaction.guild.members.fetch).not.toHaveBeenCalled();
		expect(interaction.reply).toHaveBeenCalledWith({
			content: 'AFK message set! I will reply with your message if you are tagged. Your AFK message will clear when you send a message in this server.',
			flags: MessageFlags.Ephemeral,
		});
	});

	it('creates an AFK record for a new user without changing presence', async () => {
		vi.spyOn(UserModel, 'findOne').mockResolvedValue(null);
		const save = vi.spyOn(UserModel.prototype, 'save').mockResolvedValue(undefined);
		const interaction = makeInteraction();

		await command.run({ interaction } as never);

		expect(save).toHaveBeenCalledOnce();
		const created = save.mock.instances[0];
		expect(created).toMatchObject({ guildID: 'guild1', id: 'user1', AFKmessage: 'Away', AFKstatus: null });
		expect(interaction.client.user.setPresence).not.toHaveBeenCalled();
		expect(interaction.reply).toHaveBeenCalledOnce();
	});
});
