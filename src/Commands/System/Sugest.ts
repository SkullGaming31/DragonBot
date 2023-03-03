import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, ChannelType, Colors, EmbedBuilder } from 'discord.js';
import { Command } from '../../../src/Structures/Command';
import DB from '../../Structures/Schemas/SuggestDB';

export default new Command({
	name: 'suggest',
	description: 'Suggest an improvment for the discord bot',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'member',
			description: 'describe your suggestion',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'type',
			description: 'The type of suggestion',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{ name: 'Discord', value: 'Discord' }
			]
		}
	],
	run: async ({ interaction }) => {
		const { options, guildId, channel, guild, member, user } = interaction;
		// await interaction.deferReply();

		const Suggestion = options.getString('member');
		const Type = options.getString('type');

		const Response = new EmbedBuilder()
			.setTitle('NEW SUGGESTION')
			.setColor(Colors.Blue)
			.setAuthor({ name: `${user.tag}`, iconURL: `${user.displayAvatarURL({ size: 512 })}` })
            .addFields(
                { name: 'Suggestion', value: `${Suggestion}` },
                { name: 'Type', value: `${Type}` },
                { name: 'Status', value: 'Pending...' }
                )
            .setTimestamp();

		const Buttons = new ActionRowBuilder<ButtonBuilder>();
		Buttons.addComponents(
			new ButtonBuilder().setCustomId('sugges-accept').setLabel('✅ Accept').setStyle(ButtonStyle.Primary),
			new ButtonBuilder().setCustomId('sugges-decline').setLabel('⛔ Decline').setStyle(ButtonStyle.Danger)
		);

		const suggestionChannel = guild?.channels.cache.get('1080703340549242970');
		if (channel?.id !== '1080703340549242970') return interaction.reply({ content: `❌ | you may only use this command in the suggestion channel ${suggestionChannel}` });
        if (guild?.id !== '959693430227894292') return interaction.reply({ content: '❌ | you may only use this command in the Discord Bots Test Server' });

		try {
			const M = await interaction.reply({ embeds: [Response], components: [Buttons], fetchReply: true });
			M.react('✅');
			M.react('❌');

			await DB.create({
				GuildID: guildId, MessageID: M.id,
				Details: [
					{
						MemberID: member.id,
						Title: Type,
						Suggestion: Suggestion
					}
				]
			});
		} catch (error) {
			console.log(error);
		}
	}

});