import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder } from 'discord.js';
import ticket from '../../Database/Schemas/ticketSetupDB';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'ticketsetup',
	description: 'Creates the initial ticket Embed',
	UserPerms: ['ManageChannels'],
	BotPerms: ['ManageChannels'],
	defaultMemberPermissions: ['ManageChannels'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Tickets',
	options: [
		{
			name: 'channel',
			description: 'Select the Ticket creation channel',
			type: ApplicationCommandOptionType.Channel,
			required: true,
			channelTypes: [ChannelType.GuildText],
		},
		{
			name: 'rchannel',
			description: 'Select the Member Report creation channel',
			type: ApplicationCommandOptionType.Channel,
			required: true,
			channelTypes: [ChannelType.GuildText],
		},
		{
			name: 'category',
			description: 'Select the channel category where tickets will be created',
			type: ApplicationCommandOptionType.Channel,
			required: true,
			channelTypes: [ChannelType.GuildCategory],
		},
		{
			name: 'transcripts',
			description: 'Select the transcripts channel.',
			type: ApplicationCommandOptionType.Channel,
			required: true,
			channelTypes: [ChannelType.GuildText],
		},
		{
			name: 'handlers',
			description: 'Select the role that will handle tickets',
			type: ApplicationCommandOptionType.Role,
			required: true,
		},
		{
			name: 'everyone',
			description: 'Provide the @everyone Role, Its Important',
			type: ApplicationCommandOptionType.Role,
			required: true,
		},
		{
			name: 'botrole',
			description: 'Provide your bots role',
			type: ApplicationCommandOptionType.Role,
			required: true,
		},
		{
			name: 'description',
			description: 'Set the description of the ticket embed',
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: 'reportdescription',
			description: 'Set the description of the Member Report embed',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'firstbutton',
			description: 'give your first button a name followed by a comma then the emoji',
			type: ApplicationCommandOptionType.String,
			required: false,
		},
		{
			name: 'secondbutton',
			description: 'give your second button a name followed by a comma then the emoji',
			type: ApplicationCommandOptionType.String,
			required: false,
		},
		{
			name: 'thirdbutton',
			description: 'give your third button a name followed by a comma then the emoji',
			type: ApplicationCommandOptionType.String,
			required: false,
		}
	],
	run: async ({ interaction }) => {
		const { guild, options } = interaction;

		try {
			const Channel = options.getChannel('channel');
			const RChannel = options.getChannel('rchannel');
			const Category = options.getChannel('category');
			const Transcripts = options.getChannel('transcripts');

			const Handlers = options.getRole('handlers');
			const Everyone = options.getRole('everyone');
			const BotRole = options.getRole('botrole');

			const supportDescription = options.getString('description');
			const reportDescription = options.getString('reportdescription');


			const FirstButton = options.getString('firstbutton');
			const SecondButton = options.getString('secondbutton');
			const ThirdButton = options.getString('thirdbutton');

			if (FirstButton === null || SecondButton === null || ThirdButton === null) return;

			await ticket.findOneAndUpdate(
				{ GuildID: guild?.id },
				{
					Channel: Channel?.id,
					RChannel: RChannel?.id,
					Category: Category?.id,
					Transcripts: Transcripts?.id,
					Handlers: Handlers?.id,
					Everyone: Everyone?.id,
					BotRole: BotRole?.id,
					Description: supportDescription,
					reportDescription: reportDescription,
					Buttons: [FirstButton, SecondButton, ThirdButton],
				},
				{
					new: true,
					upsert: true,
				}
			);

			const Buttons = new ActionRowBuilder<ButtonBuilder>();
			Buttons.addComponents(
				new ButtonBuilder()
					.setCustomId(FirstButton)
					.setLabel(FirstButton)
					.setStyle(ButtonStyle.Primary),
				new ButtonBuilder()
					.setCustomId(SecondButton)
					.setLabel(SecondButton)
					.setStyle(ButtonStyle.Success),
			);
			const memberButton = new ActionRowBuilder<ButtonBuilder>();
			memberButton.addComponents(
				new ButtonBuilder()
					.setCustomId(ThirdButton)
					.setLabel(ThirdButton)
					.setStyle(ButtonStyle.Secondary)
			);

			const supportEmbed = new EmbedBuilder()
				.setColor('DarkPurple')
				.setAuthor({ name: `${guild?.name} | Ticket System`, iconURL: guild?.iconURL({ size: 512 }) ?? undefined })
				.setDescription(supportDescription);
			const reportEmbed = new EmbedBuilder()
				.setColor('Red')
				.setAuthor({ name: `${guild?.name} | Report System`, iconURL: guild?.iconURL({ size: 512 }) ?? undefined })
				.setDescription(reportDescription);

			let ticketChannel;
			let reportChannel;
			if (Channel?.id !== undefined) ticketChannel = guild?.channels.cache.get(Channel?.id);
			if (RChannel?.id !== undefined) reportChannel = guild?.channels.cache.get(RChannel?.id);
			if (ticketChannel?.type === ChannelType.GuildText) await ticketChannel.send({ embeds: [supportEmbed], components: [Buttons] });
			if (reportChannel?.type === ChannelType.GuildText) await reportChannel.send({ embeds: [reportEmbed], components: [memberButton] });

			await interaction.reply({ content: 'done', ephemeral: true });
		} catch (error) {
			const errEmbed = new EmbedBuilder()
				.setColor('Red')
				.setDescription(`⛔ | An Error occured while setting up your ticket system\n **What to make sure of?**
			1. Make sure none of your buttons names are duplacated.
			2. Make sure to use this format for your buttons => Name,Emoji.
			3. Make sure your button names do not exceed 200 characters.
			4. Make sure your button emojis are actually emojis, not ids.`);
			console.error(error);
			await interaction.reply({ embeds: [errEmbed], ephemeral: true });
		}
	}
});