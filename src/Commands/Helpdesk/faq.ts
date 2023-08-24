import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from 'discord.js';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'faq',
	description: 'get help for an issue your having with overlay expert',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	defaultMemberPermissions: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'option',
			description: 'FAQ Options',
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: [
				{
					name: 'What if the preview image looks different than my overlay in the builder?',
					value: 'What if the preview image looks different than my overlay in the builder?',
				},
				{
					name: 'Alerts and how to add them to your overlay',
					value: 'Alerts and how to add them to your overlay'
				},
				{
					name: 'Resources for building overlays',
					value: 'Resources for building overlays'
				},
				{
					name: 'Regular expression syntax cheatsheet',
					value: 'Regular expression syntax cheatsheet'
				},
				{
					name: 'What image and sound files sizes, types and formats are supported?',
					value: 'What image and sound files sizes, types and formats are supported?'
				},
				{
					name: 'Why can\'t I edit my layer text and why does it keep reverting back?',
					value: 'Why can\'t I edit my layer text and why does it keep reverting back?'
				},
				{
					name: 'Why can\'t I see Streamlabs Alert Boxes in URL widgets?',
					value: 'Why can\'t I see Streamlabs Alert Boxes in URL widgets?'
				},
				{
					name: 'Twitch Extensions and how to activate them',
					value: 'Twitch Extensions and how to activate them'
				},
				{
					name: 'PlayStation 4 webcam sizes and position?',
					value: 'PlayStation 4 webcam sizes and position?'
				},
				{
					name: 'Xbox One webcam sizes and position?',
					value: 'Xbox One webcam sizes and position?'
				},
				{
					name: 'Broadcasting with a webcam',
					value: 'Broadcasting with a webcam'
				},
				{
					name: 'Why can\'t I or my viewers see my overlay over my stream?',
					value: 'Why can\'t I or my viewers see my overlay over my stream?'
				},
				{
					name: 'Why can\'t I see any overlays on the extension configuration screen?',
					value: 'Why can\'t I see any overlays on the extension configuration screen?'
				},
				{
					name: 'Why can\'t I see my custom overlays on the extension configuration screen?',
					value: 'Why can\'t I see my custom overlays on the extension configuration screen?'
				},
				{
					name: 'Why can\'t I see the option the USE overlay?',
					value: 'Why can\'t I see the option the USE overlay?'
				},
				{
					name: 'Is it normal that the viewer must always unmute the overlay?',
					value: 'Is it normal that the viewer must always unmute the overlay?'
				},
				{
					name: 'Why can\'t I see my overlay in past broadcasts or clips?',
					value: 'Why can\'t I see my overlay in past broadcasts or clips?'
				},
				{
					name: 'Why can\'t I see browser source widgets?',
					value: 'Why can\'t I see browser source widgets?'
				},
				{
					name: 'Is it possible to play music through the overlay?',
					value: 'Is it possible to play music through the overlay?'
				}
			]
		},
		{
			name: 'target',
			description: 'Who do you want to tag in the message',
			type: ApplicationCommandOptionType.User,
			required: false
		},
		{
			name: 'message',
			description: 'Send a message aswell as the link',
			type: ApplicationCommandOptionType.String,
			required: false
		}
	],
	run: async ({ interaction }) => {
		const { options, guild } = interaction;

		const Options = options.getString('option');
		const Target = options.getUser('target');
		const MessagetoSend = options.getString('message') || ' ';

		// const Channel = guild?.channels.cache.get('959693430244642822');
		const mainGuild = '1068285177891131422';
		const testGuild = '959693430227894292';

		const Embed = new EmbedBuilder()
			.setColor(Colors.White)
			.setFooter({ text: 'Level Up Legends Lounge' });

		if (guild?.id !== mainGuild && guild?.id !== testGuild) return interaction.reply({ content: 'This command only works in the Bots Main Guild', ephemeral: true });

		switch (Options) {
			case 'What if the preview image looks different than my overlay in the builder?':
				if (Target) {
					await interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('What if the preview image looks different than my overlay in the builder?'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/37gOhav`),
							Embed.setURL('https://bit.ly/37gOhav')
						]
					});
				} else {
					await interaction.reply({
						// content: 'What if the preview image looks different than my overlay in the builder? https://bit.ly/37gOhav',
						embeds: [Embed.setDescription('What if the preview image looks different than my overlay in the builder? https://bit.ly/37gOhav')],
						ephemeral: true
					});
				}
				break;
			case 'Alerts and how to add them to your overlay':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Alerts and how to add them to your overlay?'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/3m05WYk`),
							Embed.setURL('https://bit.ly/3m05WYk')
						]
					});
				} else {
					interaction.reply({
						// content: 'Alerts and how to add them to your overlay? https://bit.ly/3m05WYk',
						embeds: [
							Embed.setTitle('Alerts and how to add them to your overlay?'),
							Embed.setDescription('Alerts and how to add them to your overlay? https://bit.ly/3m05WYk'),
							Embed.setURL('https://bit.ly/3m05WYk')
						],
						ephemeral: true
					});
				}
				break;
			case 'Resources for building overlays':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Resources for building overlays!'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/35aYcMb`),
							Embed.setURL('https://bit.ly/35aYcMb')
						]
					});
				} else {
					interaction.reply({
						// content: 'Resources for building overlays! https://bit.ly/35aYcMb',
						embeds: [
							Embed.setTitle('Resources for building overlays!'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/35aYcMb`),
							Embed.setURL('https://bit.ly/35aYcMb')
						],
						ephemeral: true
					});
				}
				break;
			case 'Regular expression syntax cheatsheet':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Regular expression syntax cheatsheet!'),
							Embed.setDescription(`${MessagetoSend} https://mzl.la/3obhxFZ`),
							Embed.setURL('https://mzl.la/3obhxFZ')
						]
					});
				} else {
					interaction.reply({
						// content: 'Regular expression syntax cheatsheet! https://mzl.la/3obhxFZ',
						embeds: [
							Embed.setTitle('Regular expression syntax cheatsheet!'),
							Embed.setDescription(`${MessagetoSend} https://mzl.la/3obhxFZ`),
							Embed.setURL('https://mzl.la/3obhxFZ')
						],
						ephemeral: true
					});
				}
				break;
			case 'What image and sound files sizes, types and formats are supported?':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('What image and sound files sizes, types and formats are supported?'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/2HfTMeG`),
							Embed.setURL('https://bit.ly/2HfTMeG')
						]
					});
				} else {
					interaction.reply({
						// content: 'Regular expression syntax cheatsheet! https://bit.ly/2HfTMeG',
						embeds: [
							Embed.setTitle('What image and sound files sizes, types and formats are supported?'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/2HfTMeG`),
							Embed.setURL('https://bit.ly/2HfTMeG')
						],
						ephemeral: true
					});
				}
				// interaction.reply({ content: 'What image and sound files sizes, types and formats are supported? https://bit.ly/2HfTMeG' });
				break;
			case 'Why can\'t I edit my layer text and why does it keep reverting back?':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Why can\'t I edit my layer text and why does it keep reverting back?'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/2HkPse3`),
							Embed.setURL('https://bit.ly/2HkPse3')
						]
					});
				} else {
					interaction.reply({
						embeds: [
							Embed.setTitle('Why can\'t I edit my layer text and why does it keep reverting back?'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/2HkPse3`),
							Embed.setURL('https://bit.ly/2HkPse3')
						],
						ephemeral: true
					});
				}
				break;
			case 'Why can\'t I see Streamlabs Alert Boxes in URL widgets?':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Why can\'t I see Streamlabs Alert Boxes in URL widgets?'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/34eg1eh`),
							Embed.setURL('https://bit.ly/34eg1eh')
						]
					});
				} else {
					interaction.reply({
						// content: `${Target}`,
						embeds: [
							Embed.setTitle('Why can\'t I see Streamlabs Alert Boxes in URL widgets?'),
							Embed.setDescription('https://bit.ly/34eg1eh'),
							Embed.setURL('https://bit.ly/34eg1eh')
						]
					});
				}
				// interaction.reply({ content: 'Why can\'t I see Streamlabs Alert Boxes in URL widgets? https://bit.ly/34eg1eh' });
				break;
			case 'Twitch Extensions and how to activate them':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Twitch Extensions and how to activate them!'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/3lYBeyB`),
							Embed.setURL('https://bit.ly/3lYBeyB')
						]
					});
				} else {
					interaction.reply({
						// content: `${Target}`,
						embeds: [
							Embed.setTitle('Twitch Extensions and how to activate them!'),
							Embed.setDescription('https://bit.ly/3lYBeyB'),
							Embed.setURL('https://bit.ly/3lYBeyB')
						]
					});
				}
				// interaction.reply({ content: 'Twitch Extensions and how to activate them! https://bit.ly/3lYBeyB' });
				break;
			case 'PlayStation 4 webcam sizes and position?':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('PlayStation 4 webcam sizes and position'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/3mGqKnQ`),
							Embed.setURL('https://bit.ly/3mGqKnQ')
						]
					});
				} else {
					interaction.reply({
						embeds: [
							Embed.setTitle('PlayStation 4 webcam sizes and position'),
							Embed.setDescription('https://bit.ly/3mGqKnQ'),
							Embed.setURL('https://bit.ly/3mGqKnQ')
						]
					});
				}
				// interaction.reply({ content: 'PlayStation 4 webcam sizes and position https://bit.ly/3mGqKnQ' });
				break;
			case 'Xbox One webcam sizes and position?':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Xbox One webcam sizes and position?'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/3mIcJX4`),
							Embed.setURL('https://bit.ly/3mIcJX4')
						]
					});
				} else {
					interaction.reply({
						// content: `${Target}`,
						embeds: [
							Embed.setTitle('Xbox One webcam sizes and position?'),
							Embed.setDescription('https://bit.ly/3mIcJX4'),
							Embed.setURL('https://bit.ly/3mIcJX4')
						],
						ephemeral: true
					});
				}
				// interaction.reply({ content: 'Xbox One webcam sizes and position? https://bit.ly/3mIcJX4' });
				break;
			case 'Broadcasting with a webcam':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Broadcasting with a webcam'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/3ejh0Ni`),
							Embed.setURL('https://bit.ly/3ejh0Ni')
						]
					});
				} else {
					interaction.reply({
						// content: `${Target}`,
						embeds: [
							Embed.setTitle('Broadcasting with a webcam'),
							Embed.setDescription('https://bit.ly/3ejh0Ni'),
							Embed.setURL('https://bit.ly/3ejh0Ni')
						],
						ephemeral: true
					});
				}
				// interaction.reply({ content: 'Broadcasting with a webcam https://bit.ly/3ejh0Ni' });
				break;
			case 'Why can\'t I or my viewers see my overlay over my stream?':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Why can\'t I or my viewers see my overlay over my stream?'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/31lg9qo`),
							Embed.setURL('https://bit.ly/31lg9qo')
						]
					});
				} else {
					interaction.reply({
						// content: `${Target}`,
						embeds: [
							Embed.setTitle('Why can\'t I or my viewers see my overlay over my stream?'),
							Embed.setDescription('https://bit.ly/31lg9qo'),
							Embed.setURL('https://bit.ly/31lg9qo')
						],
						ephemeral: true
					});
				}
				// interaction.reply({ content: 'Why can\'t I or my viewers see my overlay over my stream? https://bit.ly/31lg9qo' });
				break;
			case 'Why can\'t I see any overlays on the extension configuration screen?':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Why can\'t I see any overlays on the extension configuration screen?'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/2HdrqSv`),
							Embed.setURL('https://bit.ly/2HdrqSv')
						]
					});
				} else {
					interaction.reply({
						// content: `${Target}`,
						embeds: [
							Embed.setTitle('Why can\'t I see any overlays on the extension configuration screen?'),
							Embed.setDescription('https://bit.ly/2HdrqSv'),
							Embed.setURL('https://bit.ly/2HdrqSv')
						],
						ephemeral: true
					});
				}
				// interaction.reply({ content: 'Why can\'t I see any overlays on the extension configuration screen? https://bit.ly/2HdrqSv' });
				break;
			case 'Why can\'t I see my custom overlays on the extension configuration screen?':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Why can\'t I see my custom overlays on the extension configuration screen?'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/3j6Ha73`),
							Embed.setURL('https://bit.ly/3j6Ha73')
						]
					});
				} else {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Why can\'t I see my custom overlays on the extension configuration screen?'),
							Embed.setDescription('https://bit.ly/3j6Ha73'),
							Embed.setURL('https://bit.ly/3j6Ha73')
						],
						ephemeral: true
					});
				}
				// interaction.reply({ content: 'Why can\'t I see my custom overlays on the extension configuration screen? https://bit.ly/3j6Ha73' });
				break;
			case 'Why can\'t I see the option the USE overlay?':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Why can\'t I see the option the USE overlay?'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/2U6U6zJ`),
							Embed.setURL('https://bit.ly/2U6U6zJ')
						]
					});
				} else {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Why can\'t I see the option the USE overlay?'),
							Embed.setDescription('https://bit.ly/2U6U6zJ'),
							Embed.setURL('https://bit.ly/2U6U6zJ')
						],
						ephemeral: true
					});
				}
				// interaction.reply({ content: 'Why can\'t I see the option the USE overlay? https://bit.ly/2U6U6zJ' });
				break;
			case 'Is it normal that the viewer must always unmute the overlay?':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Is it normal that the viewer must always unmute the overlay?'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/31lbe8J`),
							Embed.setURL('https://bit.ly/31lbe8J')
						]
					});
				} else {
					interaction.reply({
						// content: `${Target}`,
						embeds: [
							Embed.setTitle('Is it normal that the viewer must always unmute the overlay?'),
							Embed.setDescription('https://bit.ly/31lbe8J'),
							Embed.setURL('https://bit.ly/31lbe8J')
						],
						ephemeral: true
					});
				}
				// interaction.reply({ content: 'Is it normal that the viewer must always unmute the overlay? https://bit.ly/31lbe8J' });
				break;
			case 'Why can\'t I see my overlay in past broadcasts or clips?':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Why can\'t I see my overlay in past broadcasts or clips?'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/35gYu4q`),
							Embed.setURL('https://bit.ly/35gYu4q')
						]
					});
				} else {
					interaction.reply({
						// content: `${Target}`,
						embeds: [
							Embed.setTitle('Why can\'t I see my overlay in past broadcasts or clips?'),
							Embed.setDescription('https://bit.ly/35gYu4q'),
							Embed.setURL('https://bit.ly/35gYu4q')
						],
						ephemeral: true
					});
				}
				// interaction.reply({ content: 'Why can\'t I see my overlay in past broadcasts or clips? https://bit.ly/35gYu4q' });
				break;
			case 'Why can\'t I see browser source widgets?':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Why can\'t I see browser source widgets?'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/3479zFA`),
							Embed.setURL('https://bit.ly/3479zFA')
						]
					});
				} else {
					interaction.reply({
						// content: `${Target}`,
						embeds: [
							Embed.setTitle('Why can\'t I see browser source widgets?'),
							Embed.setDescription('https://bit.ly/3479zFA'),
							Embed.setURL('https://bit.ly/3479zFA')
						],
						ephemeral: true
					});
				}
				// interaction.reply({ content: 'Why can\'t I see browser source widgets? https://bit.ly/3479zFA' });
				break;
			case 'Is it possible to play music through the overlay?':
				if (Target) {
					interaction.reply({
						content: `${Target}`,
						embeds: [
							Embed.setTitle('Is it possible to play music through the overlay?'),
							Embed.setDescription(`${MessagetoSend} https://bit.ly/35a5mjJ`),
							Embed.setURL('https://bit.ly/35a5mjJ')
						]
					});
				} else {
					interaction.reply({
						// content: `${Target}`,
						embeds: [
							Embed.setTitle('Is it possible to play music through the overlay?'),
							Embed.setDescription('https://bit.ly/35a5mjJ'),
							Embed.setURL('https://bit.ly/35a5mjJ')
						],
						ephemeral: true
					});
				}
				// interaction.reply({ content: 'Is it possible to play music through the overlay? https://bit.ly/35a5mjJ' });
				break;
		}
	}
});