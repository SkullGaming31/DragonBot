import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import DB from '../../Database/Schemas/SuggestDB';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'suggest',
	description: 'Suggest an improvment for the discord bot',
	// UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'name',
			description: 'give a name to your suggestion',
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
			description: 'The type of suggestion(suggestion for Twitch or Discord)',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{ name: 'Discord', value: 'Discord' },
				{ name: 'Twitch', value: 'Twitch' }
			]
		}
	],
	run: async ({ interaction }) => {
		const { options, channel, guild, member, user } = interaction;

		const Name = options.getString('name');
		const Type = options.getString('type');
		const Description = options.getString('description');

		const Response = new EmbedBuilder()
			.setTitle('NEW SUGGESTION')
			.setColor('Blue')
			.setAuthor({ name: `${user.globalName || user.username}`, iconURL: `${user.displayAvatarURL({ size: 512 })}` })
			.setDescription(Description)
			.addFields(
				{ name: 'Name', value: `${Name}` },
				{ name: 'Type', value: `${Type}` },
				{ name: 'Status', value: 'Pending...' }
			)
			.setTimestamp();

		const Buttons = new ActionRowBuilder<ButtonBuilder>();
		Buttons.addComponents(
			new ButtonBuilder().setCustomId('sugges-accept').setLabel('✅ Accept').setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId('sugges-decline').setLabel('⛔ Decline').setStyle(ButtonStyle.Danger)
		);

		const suggestionChannel = guild?.channels.cache.get('1142639289264513115');
		if (channel?.id !== '1142639289264513115') return interaction.reply({ content: `❌ | you may only use this command in the suggestion channel ${suggestionChannel}`, ephemeral: true });
		if (guild?.id !== '1068285177891131422') return interaction.reply({ content: '❌ | you may only use this command in the Discord Bots Main Server', ephemeral: true });

		try {
			const M = await interaction.reply({ embeds: [Response], components: [Buttons], fetchReply: true });
			// M.react('✅');
			// M.react('❌');

			await DB.create({
				guildId: guild.id, messageId: M.id,
				details: [
					{
						MemberID: member.id,
						Title: Type,
						Name: Name
					}
				]
			});
		} catch (error) {
			console.error(error);
		}
	}

});