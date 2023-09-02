import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, Colors, ComponentType, EmbedBuilder } from 'discord.js';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'unban',
	description: 'unban a member from the guild',
	UserPerms: ['BanMembers'],
	BotPerms: ['BanMembers'],
	defaultMemberPermissions: ['BanMembers'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'user-id',
			description: 'provide the users id',
			type: ApplicationCommandOptionType.String,
			required: true
		}
	],
	run: async ({ interaction }) => {
		if (!interaction.inCachedGuild()) return;

		await interaction.deferReply({ ephemeral: true });
		const { options, user, guild } = interaction;

		const id = options.getString('user-id');
		if (id === null) return;
		if (!/^\d+$/.test(id)) return interaction.editReply({ content: '❌ | Please provide a valid ID in numbers!' });
		const bannedMembers = await guild.bans.fetch();
		if (!bannedMembers.find(x => x.user.id === id)) return interaction.editReply({ content: '❌ | the user is not banned' });


		const unbanEmbed = new EmbedBuilder().setColor(Colors.Blue);

		const row = new ActionRowBuilder<ButtonBuilder>();
		row.addComponents(
			new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId('unban-yes').setLabel('Yes'),
			new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('unban-no').setLabel('No')
		);
		const page = await interaction.editReply({
			embeds: [unbanEmbed.setDescription('**⚠ | do you really wanna unban this member?**')],
			components: [row]
		});
		const col = page.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 150000
		});
		col.on('collect', async i => {
			if (i.user.id !== user.id) return;

			switch (i.customId) {
				case 'unban-yes':

					// Attempt to unban the user
					try {
						await guild.members.unban(id);
					} catch (error) {
						console.error('Error while unbanning:', error);
					}

					interaction.editReply({ embeds: [unbanEmbed.setDescription('**✔ | the user has been unbanned**')], components: [] });
					break;
				case 'unban-no':
					interaction.editReply({ embeds: [unbanEmbed.setDescription('✅ | unban Request Canceled')], components: [] });
					break;
			}
		});
		col.on('end', (collected) => {
			if (collected.size > 0) return;
			interaction.editReply({
				embeds: [unbanEmbed.setDescription('❌ | you did not provide a valid response in time')],
				components: []
			});
		});
	}
});