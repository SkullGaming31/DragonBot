import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from 'discord.js';
import { Command } from '../../../src/Structures/Command';

export default new Command({
	name: 'mobile',
	description: 'get help for an issue your having with overlay expert',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	type: ApplicationCommandType.ChatInput,
	options: [
		{
			name: 'target',
			description: 'Who do you want to tag in the message',
			type: ApplicationCommandOptionType.User,
			required: false
		}
	],
	run: async ({ interaction }) => {
		const { guild, user, options } = interaction;

		const Target = options.getUser('target');

		try {
			const mobileEmbed = new EmbedBuilder()
				.setTitle('Mobile Help')
				.setColor(Colors.Blue)
				.addFields([
					{
						name: '**READ**',
						value: 'No Twitch Extension can overlay the video on mobile; this is a limitation of the Twitch Extension Platform itself and not of Overlay Expert. Until Twitch improves the Extension Platform and allows extensions to overlay the video on mobile, you can use the **mobile chat view** that when activated will appear below your video and show alerts over your chat or ask your community to view your stream from a **mobile browser in "desktop mode"**.',
						inline: false
					},
					{
						name: 'Workaround: ',
						value: 'You can have your viewers go to https://overlay.expert/w/YOUR_TWITCH_CHANNEL to view your overlay on mobile',
						inline: false
					},
					{
						name: 'TwitchStatus Update on UserVoice',
						value: 'a status update on the userVoice has been posted regarding letting mobile viewers see overlays here: https://twitch.uservoice.com/forums/904711-extensions/suggestions/40301335',
						inline: false
					}
				])
				.setFooter({ text: `${guild?.name}` })
				.setTimestamp();

			if (Target) {
				mobileEmbed.setAuthor({ name: `${Target.tag}`, iconURL: Target.displayAvatarURL({ size: 512 }) });
				mobileEmbed.setThumbnail(`${Target.displayAvatarURL({ size: 512 })}`);
				return await interaction.reply({ content: `${Target}`, embeds: [mobileEmbed] });
			} else {
				mobileEmbed.setAuthor({ name: `${interaction.user.tag}`, iconURL: `${user.displayAvatarURL({ size: 512 })}` });
				mobileEmbed.setThumbnail(user.displayAvatarURL({ size: 512 }));
				return await interaction.reply({ embeds: [mobileEmbed] });
			}
		} catch (error) {
			console.error(error);
			return;
		}
	}
});