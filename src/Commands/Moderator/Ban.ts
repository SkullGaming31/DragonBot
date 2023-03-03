import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, Colors, ComponentType, EmbedBuilder } from 'discord.js';
import { Command } from '../../../src/Structures/Command';

export default new Command({
	name: 'ban',
	description: 'bans a member from the guild',
	UserPerms: ['BanMembers'],
	BotPerms: ['BanMembers'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'user',
			description: 'select a member to ban from the guild',
			type: ApplicationCommandOptionType.User,
			required: true
		},
		{
			name: 'reason',
			description: 'the reason you are banning this member',
			type: ApplicationCommandOptionType.String,
			required: false
		}
	],
	run: async ({ interaction }) => {
		if (!interaction.inCachedGuild()) return;

		await interaction.deferReply({ ephemeral: true });

		const { options, user, guild } = interaction;
		const member = options.getMember('user');
		const reason = options.getString('reason') || 'No Reason Provided';

		//check permissions
		if (member?.id === user.id) return interaction.editReply({ content: '❌ | You can not ban yourself from the guild' });
		if (guild.ownerId === member?.id) return interaction.editReply({ content: '❌ | Someones on a Power Tripping Session, you cant ban the owner' });
		// if (guild.members.me.roles.highest.position <= member.roles.highest.position) return interaction.editReply({ content: '❌ | you cant ban a member of your level or higher' });
		// if (interaction.member.roles.highest.position <= member.roles.highest.position) return interaction.editReply({ content: '❌ | you cant ban a member of your level or higher' });

		const banEmbed = new EmbedBuilder().setColor(Colors.Blue);
		const row = new ActionRowBuilder<ButtonBuilder>();
		row.addComponents(
			new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId('ban-yes').setLabel('Yes'),
			new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('ban-no').setLabel('No')
		);
		const page = await interaction.editReply({
			embeds: [
				banEmbed.setDescription('**⚠ | do you really wanna ban this member?**')
			],
			components: [row]
		});
		const col = page.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 150000
		});
		col.on('collect', i => {
			if (i.user.id !== user.id) return;
			switch (i.customId) {
				case 'ban-yes':
					if (member?.bannable) member.ban({ reason: reason });
					interaction.editReply({
						embeds: [
							banEmbed.setDescription(`✔ | ${member} **has been banned for : ${reason}**`)
						],
						components: []
					});
					member?.send({
						embeds: [
							new EmbedBuilder()
								.setColor(Colors.Red)
								.addFields([
									{
										name: 'Reason',
										value: `you were banned from ${guild} for ${reason}`,
										inline: true
									}
								])
						]
					}).catch(err => {
						if (err.code !== 50007) return console.error('Users Dm\'s are turned off', err);
					});
					break;
				case 'ban-no':
					interaction.editReply({
						embeds: [
							banEmbed.setDescription('✅ | ban Request Canceled')
						],
						components: []
					});
					break;
			}
		});
		col.on('end', (collected) => {
			if (collected.size > 0) return;
			interaction.editReply({
				embeds: [banEmbed.setDescription('❌ | you did not provide a valid response in time')],
				components: []
			});
		});
	}

});