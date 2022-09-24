import { ApplicationCommandOptionType, ApplicationCommandType, Colors, EmbedBuilder } from "discord.js";
import { Command } from "../../Structures/Command";

export default new Command({
	name: 'get-help',
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
	run: async ({ interaction, client }) => {
		const { guild, user, options } = interaction;

		const Target = options.getUser('target');

		try {
			const helpEmbed = new EmbedBuilder()
				.setTitle('Overlay Expert')
				.setDescription('To begin helping you, please: ')
				.setColor(Colors.White)
				.addFields({ name: '1.', value: 'go live on Twitch', inline: false })
				.addFields({ name: '2.', value: 'open your PC web browser or mobile web browser in **desktop mode**', inline: false })
				.addFields({ name: '3.', value: 'navigate to your Twitch channel (i.e. `https://twitch.tv/YOUR_USERNAME`)', inline: false })
				.addFields({ name: '4.', value: 'take a screenshot and upload it here (screenshots of your extension configuration screen or builder may also be helpful) If you or your viewers are **watching from the Twitch mobile app** or Console, please type `/mobile`.', inline: false })
				.setFooter({ text: `${guild?.name}` });

			if (Target) {
				helpEmbed.setAuthor({ name: `${Target.tag}`, iconURL: Target.displayAvatarURL({ size: 512 }) })
				helpEmbed.setThumbnail(`${Target.displayAvatarURL({ size: 512 })}`)
				return await interaction.reply({ content: `${Target}`, embeds: [helpEmbed] });
			} else {
				helpEmbed.setAuthor({ name: `${user.username}`, iconURL: `${user.displayAvatarURL({ size: 512 })}` })
				return await interaction.reply({ embeds: [helpEmbed] })
			}
		} catch (error) {
			console.error(error);
			return;
		}
	}
});