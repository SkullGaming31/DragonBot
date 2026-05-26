import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, Colors, EmbedBuilder } from 'discord.js';
import DB, { Ticket } from '../../Database/Schemas/ticketDB';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'ticket',
	description: 'Ticket Actions',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Tickets',
	options: [
		{
			name: 'action',
			description: 'add or remove a member from the ticket',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{ name: 'Add', value: 'add' },
				{ name: 'Remove', value: 'remove' }
			]
		},
		{
			name: 'member',
			description: 'add a member to the ticket',
			type: ApplicationCommandOptionType.User,
			required: true
		}
	],
	run: async ({ interaction }) => {
		if (!interaction.inCachedGuild()) return;
		const { guildId, options, channel } = interaction;

		const Action = options.getString('action');
		const Member = options.getMember('member') || undefined;

		if (Member === undefined) return;

		const embed = new EmbedBuilder();

		switch (Action) {
			case 'add': {
				const docs = await DB.findOne({ GuildID: guildId, ChannelID: channel?.id }).exec() as Ticket | null;
				if (!docs) return interaction.reply({ embeds: [embed.setColor(Colors.Red).setDescription('⛔ | this channel is not tied with a ticket')], ephemeral: true });
				if (docs.MembersID?.includes(Member?.id as string)) return interaction.reply({ embeds: [embed.setColor(Colors.Red).setDescription('⛔ | this member is already added to this ticket')], ephemeral: true });
				docs.MembersID = docs.MembersID ?? [];
				docs.MembersID.push(Member?.id as string);
				if (channel?.type === ChannelType.GuildText) {
					await channel.permissionOverwrites.edit(Member?.id as string, {
						SendMessages: true,
						ViewChannel: true,
						ReadMessageHistory: true,
						AttachFiles: true
					});
				}
				await interaction.reply({ content: `${Member}`, embeds: [embed.setColor(Colors.Green).setDescription(`✅ | ${Member} has been added to the ticket`)] });
				await docs.save();
			}
				break;
				break;
			case 'remove': {
				const docs = await DB.findOne({ GuildID: guildId, ChannelID: channel?.id }).exec() as Ticket | null;
				if (!docs) return interaction.reply({ embeds: [embed.setColor(Colors.Red).setDescription('⛔ | this channel is not tied with a ticket')], ephemeral: true });
				if (!docs.MembersID?.includes(Member?.id as string)) return interaction.reply({ embeds: [embed.setColor(Colors.Red).setDescription('⛔ | this member is not in this ticket')], ephemeral: true });
				docs.MembersID = docs.MembersID.filter(id => id !== (Member?.id as string));
				if (channel?.type === ChannelType.GuildText) await channel.permissionOverwrites.edit(Member?.id as string, { ViewChannel: false });
				await interaction.reply({ embeds: [embed.setColor(Colors.Green).setDescription(`✅ | ${Member} has been removed from the ticket`)] });
				await docs.save();
			}
				break;
				break;
		}
	}
});