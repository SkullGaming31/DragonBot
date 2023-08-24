/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, Colors, EmbedBuilder } from 'discord.js';
import { MongooseError } from 'mongoose';
import DB from '../../Database/Schemas/ticketDB';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'ticket',
	description: 'Ticket Actions',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,
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
			case 'add':
				DB.findOne({ GuildID: guildId, ChannelID: channel?.id }, async (err: MongooseError, docs: { MembersID: string[]; save: () => void; }) => {
					if (err) throw err.message;
					if (!docs) return interaction.reply({
						embeds: [embed.setColor(Colors.Red).setDescription('⛔ | this channel is not tied with a ticket')], ephemeral: true
					});
					if (docs.MembersID.includes(Member?.id)) return interaction.reply({
						embeds: [embed.setColor(Colors.Red).setDescription('⛔ | this member is already added to this ticket')], ephemeral: true
					});
					docs.MembersID.push(Member?.id);
					if (channel?.type === ChannelType.GuildText)
						channel?.permissionOverwrites.edit(Member?.id, {
							SendMessages: true,
							ViewChannel: true,
							ReadMessageHistory: true,
							AttachFiles: true
						});
					interaction.reply({
						content: `${Member}`, embeds: [embed.setColor(Colors.Green).setDescription(`✅ | ${Member} has been added to the ticket`)]
					});
					docs.save();
				});
				break;
			case 'remove':
				DB.findOne({ GuildID: guildId, ChannelID: channel?.id }, async (err: any, docs: { MembersID: { includes: (arg0: string) => any; remove: (arg0: string) => void; }; save: () => void; }) => {
					if (err) throw err;
					if (!docs) return interaction.reply({
						embeds: [embed.setColor(Colors.Red).setDescription('⛔ | this channel is not tied with a ticket')], ephemeral: true
					});
					if (!docs.MembersID.includes(Member?.id)) return interaction.reply({
						embeds: [embed.setColor(Colors.Red).setDescription('⛔ | this member is not in this ticket')], ephemeral: true
					});
					docs.MembersID.remove(Member?.id);
					if (channel?.type === ChannelType.GuildText)
						channel?.permissionOverwrites.edit(Member?.id, {
							ViewChannel: false,
						});
					interaction.reply({
						embeds: [embed.setColor(Colors.Green).setDescription(`✅ | ${Member} has been removed from the ticket`)]
					});
					docs.save();
				});
				break;
		}
	}

});