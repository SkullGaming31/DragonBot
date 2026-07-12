import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, Message } from 'discord.js';
import { Command } from '../../Structures/Command';
import { error as logError } from '../../Utilities/logger';

export default new Command({
	name: 'clear',
	description: 'Clears Messages from the channel',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Moderator',
	options: [
		{
			name: 'amount',
			description: 'the ammount of messages you wanna clear from the channel',
			type: ApplicationCommandOptionType.Number,
			required: true
		},
		{
			name: 'target',
			description: 'the member you want to clear the messages for',
			type: ApplicationCommandOptionType.User,
			required: false
		}
	],
	run: async ({ interaction }) => {
		try {
			if (!interaction.inCachedGuild()) return;
			const { channel, options } = interaction;

			const Amount = options.getNumber('amount');
			const Target = options.getMember('target');

			const Messages = await channel?.messages.fetch({ limit: 100 });

			if (Messages === undefined) return;
			if (Amount === null) return interaction.reply({ content: 'You must provide an amount to clear' });
			const response = new EmbedBuilder().setColor('NotQuiteBlack');

			if (Target) {
				let i = 0;
				const filtered: Message[] = [];
				(Messages).filter((m: Message) => {
					if (m.author.id === Target.id && Amount > i) {
						filtered.push(m);
						i++;
					}
				});
				await channel?.bulkDelete(filtered, true).then(async (messages) => {
					response.setDescription(`🧹 ${interaction.user.username} Cleared ${messages.size} messages from ${Target}`)
						.setColor('Red');
					await interaction.reply({ embeds: [response] });
				}).catch((err) => { logError('Error Deleting Messages from Channel and target', { error: (err as Error)?.message ?? err, target: Target?.id }); });
			} else {
				await channel?.bulkDelete(Amount, true).then(async (messages) => {
					response.setDescription(`🧹 ${interaction.user.username} Cleared ${messages.size} messages from the channel`)
						.setColor('Red');
					await interaction.reply({ embeds: [response] });
				}).catch((err) => { logError('Error Deleting Messages from channel', { error: (err as Error)?.message ?? err }); });
			}
		} catch (error) {
			logError('Error in clear command', { error: (error as Error)?.message ?? error });
		}
	}
});