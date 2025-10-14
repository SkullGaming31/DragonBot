import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } from 'discord.js';
import DB from '../../Database/Schemas/SuggestDB';
import { Command } from '../../Structures/Command';
import SettingsModel from '../../Database/Schemas/settingsDB';

export default new Command({
	name: 'feature',
	description: 'Suggest an improvment for the discord/twitch bot',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	Category: 'System',
	options: [
		{
			name: 'name',
			description: 'give a name to your feature suggestion',
			type: ApplicationCommandOptionType.String,
			maxLength: 50,
			minLength: 5,
			required: true
		},
		{
			name: 'description',
			description: 'describe your suggestion',
			type: ApplicationCommandOptionType.String,
			maxLength: 2048,
			minLength: 1,
			required: true
		},
		{
			name: 'type',
			description: 'The type of feature(suggestion for Twitch or Discord)',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{ name: 'Discord', value: 'Discord' },
				{ name: 'Twitch', value: 'Twitch' }
			]
		}
	],
	run: async ({ interaction }) => {
		console.log('Feature command initiated');
		const { options, channel, guild, member, user } = interaction;

		// Validate guild exists
		if (!guild) {
			if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') { console.log('No guild found'); }

			return interaction.reply({ content: '❌ This command can only be used in a server.', flags: MessageFlags.Ephemeral });
		}

		// Get suggestion details
		const Name = options.getString('name', true);
		const Type = options.getString('type', true);
		const Description = options.getString('description', true);

		// Create Response Embed
		const Response = new EmbedBuilder()
			.setTitle('NEW FEATURE REQUEST')
			.setColor('Blue')
			.setAuthor({ name: user.bot ? user.tag : (user.globalName || user.username || user.tag), iconURL: user.displayAvatarURL({ size: 512 }) })
			.setDescription(Description)
			.addFields(
				{ name: 'Name', value: Name },
				{ name: 'Type', value: Type },
				{ name: 'Status', value: 'Pending...' }
			)
			.setTimestamp();

		// Create buttons
		const Buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder().setCustomId('sugges-accept').setLabel('✅ Accept').setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId('sugges-decline').setLabel('⛔ Decline').setStyle(ButtonStyle.Danger)
		);

		try {
			// Check for configured suggestion channel
			const data = await SettingsModel.findOne({ GuildID: guild.id });
			const featureChannelId = data?.SuggestChan;
			const targetChannel = featureChannelId ? guild.channels.cache.get(featureChannelId) : channel;

			// Validate target channel
			if (!targetChannel?.isSendable()) {
				if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') { console.log('Invalid target channel'); }

				return interaction.reply({ content: '❌ Could not find a valid channel to send the suggestion.', flags: MessageFlags.Ephemeral });
			}

			// Check if command is in correct channel (if configured)
			if (featureChannelId && channel?.id !== featureChannelId) {
				if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') { console.log('Command used in wrong channel'); }

				return interaction.reply({ content: `❌ Please use this command in the suggestions channel: <#${featureChannelId}>`, flags: MessageFlags.Ephemeral });
			}

			// Send the suggestion
			if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') { console.log('Attempting to send suggestion'); }

			const M = await targetChannel.send({
				embeds: [Response],
				components: [Buttons],
				poll: {
					question: { text: `Would you like to to see this feature in the ${Type} Bot` },
					answers: [
						{ text: 'Yes' },
						{ text: 'No' },
						{ text: 'no opinion on this' }
					],
					duration: 10,
					allowMultiselect: false
				},
				options: { withResponse: true }
			});
			// Create database entry
			await DB.create({
				guildId: guild.id,
				messageId: M.id,
				details: [{
					MemberID: member.id,
					Title: Type,
					Name: Name,
					Description: Description
				}]
			});

			// Respond to user
			if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') { console.log('Sending success response'); }

			await interaction.reply({ content: `✅ Your suggestion has been submitted${featureChannelId ? '' : ' in this channel'}!`, flags: MessageFlags.Ephemeral });

		} catch (error: unknown) {
			if (process.env.Enviroment === 'dev' || process.env.Enviroment === 'debug') { console.error('Error in feature command:', error); }

			await interaction.reply({ content: '❌ Failed to submit your suggestion. Please try again.', flags: MessageFlags.Ephemeral });
		}
	}
});