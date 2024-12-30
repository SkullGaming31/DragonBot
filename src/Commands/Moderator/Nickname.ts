import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from 'discord.js';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'nickname',
	description: 'manage someones nickname in your server',
	UserPerms: ['ManageNicknames'],
	BotPerms: ['ManageNicknames'],
	defaultMemberPermissions: ['ManageNicknames'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Moderator',
	options: [
		{
			name: 'target',
			description: 'The target you want to manage the nickname for',
			type: ApplicationCommandOptionType.User,
			required: true
		},
		{
			name: 'nickname',
			description: 'the nickname you want to give them in your server',
			type: ApplicationCommandOptionType.String,
			required: false
		},
		{
			name: 'reason',
			description: 'The reason you are changing there nickname in the server',
			type: ApplicationCommandOptionType.String
		},
	],
	run: async ({ interaction }) => {
		if (!interaction.inCachedGuild()) return;

		const { options, guild } = interaction;
		const Nickname = options.getUser('target');
		if (Nickname === null) return;
		const Target = guild.members.cache.get(Nickname.id);
		const Reason = options.getString('reason') || 'No Reason Provided';
		const setNickname = options.getString('nickname') || null;

		let nameReset;
		if (setNickname === null) nameReset = `Nickname has been successfully Reset to Original name. Reason: ${Reason}`;
		if (setNickname !== null) nameReset = `Nickname has been successfully changed to ${setNickname}. Reason: ${Reason}`;
		if (nameReset === undefined) return;

		const embed = new EmbedBuilder()
			.setTitle('NICKNAME EDITED')
			.setDescription(nameReset)
			.setColor(Colors.Red);
		try {
			await Target?.setNickname(setNickname, Reason);
			await interaction.reply({ embeds: [embed], ephemeral: true });
		} catch (error) {
			console.error(error);
			return;
		}
	}
});