import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, Colors, ComponentType, DiscordAPIError, EmbedBuilder, MessageFlags } from 'discord.js';
import ms from 'ms';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'kick',
	description: 'Kicks a member from the guild',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Moderator',
	options: [
		{
			name: 'user',
			description: 'select a member to kick from the guild',
			type: ApplicationCommandOptionType.User,
			required: true
		},
		{
			name: 'reason',
			description: 'the reason you are kicking this member',
			type: ApplicationCommandOptionType.String,
			required: false
		}
	],
	run: async ({ interaction }) => {
		if (!interaction.inCachedGuild()) return;
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const { options, user, guild } = interaction;
		const member = options.getMember('user');
		const reason = options.getString('reason') || 'No Reason Provided';

		if (guild.members.me === null) return;
		if (member?.roles.highest.position === undefined) return;

		if (member?.id === user.id) return interaction.editReply({ content: '❌ | You can not kick yourself from the guild' });
		if (guild?.ownerId === member?.id) return interaction.editReply({ content: '❌ | Someones on a Power Tripping Session, you cant kick the owner, the guild would be deleted.' });
		if (guild.members.me.roles.highest.position <= member?.roles.highest.position) return interaction.editReply({ content: '❌ | you cant kick a member of your level or higher' });
		if (member?.roles.highest.position <= member?.roles.highest.position) return interaction.editReply({ content: '❌ | you cant kick a member of your level or higher' });

		const kickEmbed = new EmbedBuilder().setColor(Colors.Blue);
		const row = new ActionRowBuilder<ButtonBuilder>();
		row.addComponents(
			new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId('kick-yes').setLabel('Yes'),
			new ButtonBuilder().setStyle(ButtonStyle.Primary).setCustomId('kick-no').setLabel('No')
		);
		const page = await interaction.editReply({
			embeds: [
				kickEmbed.setDescription('**⚠ | do you really wanna kick this member?**')
			],
			components: [row]
		});
		const col = page.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: ms('15s')
		});
		col.on('collect', async i => {
			if (i.user.id !== user.id) return;
			switch (i.customId) {
				case 'kick-yes':
					await member?.kick(reason);
					interaction.editReply({
						embeds: [
							kickEmbed.setDescription(`✔ | ${member} **has been kicked for : ${reason}**`)
						],
						components: []
					});
					await member?.send({
						embeds: [
							new EmbedBuilder()
								.setColor(Colors.Red)
								.addFields([
									{
										name: 'Reason',
										value: `you were kicked from ${guild} for ${reason}`,
										inline: true
									}
								])
						]
					}).catch((err: DiscordAPIError) => {
						if (err.code !== 50007) return console.error('Users Dm\'s are turned off', err);
					});
					break;
				case 'kick-no':
					await interaction.editReply({
						embeds: [
							kickEmbed.setDescription('✅ | Kick Request Canceled')
						],
						components: []
					});
					break;
			}
		});
		col.on('end', (collected) => {
			if (collected.size > 0) return;
			interaction.editReply({
				embeds: [kickEmbed.setDescription('❌ | you did not provide a valid response in time')],
				components: []
			});
		});
	}
});