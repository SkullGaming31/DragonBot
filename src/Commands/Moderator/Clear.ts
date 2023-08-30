import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'clear',
	description: 'Clears Messages from the channel',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,
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
		if (!interaction.inCachedGuild()) return;

		interaction.reply({ content: 'Not Currently Working', ephemeral: true });

		// const { channel, options } = interaction;

		// const Amount = options.getNumber('amount');
		// const Target = options.getMember('target');

		// const Messages = await channel?.messages.fetch();

		// if (Messages === undefined) return;
		// if (Amount === null) return interaction.reply({ content: 'You must provide an amount to clear' });
		// const response = new EmbedBuilder().setColor('NotQuiteBlack');

		// if (Target) {
		// 	let i = 0;
		// 	const filtered: Message[] = [];
		// 	(Messages).filter((m: Message) => {
		// 		if (m.author.id === Target.id && Amount > i) {
		// 			filtered.push(m);
		// 			i++;
		// 		}
		// 	});
		// 	await channel?.bulkDelete(filtered, true).then(async (messages) => {
		// 		response.setDescription(`🧹 ${interaction.user.username} Cleared ${messages.size} messages from ${Target}`)
		// 			.setColor('Red');
		// 		await interaction.reply({ embeds: [response] });
		// 	});
		// } else {
		// 	await channel?.bulkDelete(Amount, true).then(async (messages) => {
		// 		response.setDescription(`🧹 ${interaction.user.username} Cleared ${messages.size} messages from the channel`)
		// 			.setColor('Red');
		// 		await interaction.reply({ embeds: [response] });
		// 	});
		// }
	}
});