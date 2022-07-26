const { CommandInteraction, EmbedBuilder, ApplicationCommandOptionType, Colors, PermissionFlagsBits } = require('discord.js');

module.exports = {
	name: 'get-help',
	description: 'get help for an issue your having with overlay expert',
	UserPerms: ['SendMessages'],
	BotPerms: ['SendMessages'],
	options: [
		{
			name: 'target',
			description: 'Who do you want to tag in the message',
			type: ApplicationCommandOptionType.User,
			required: false
		}
	],
	/**
	 * 
	 * @param {CommandInteraction} interaction 
	 */
	async execute(interaction) {
		const { guild, user, options, member } = interaction;

		const Target = options.getUser('target');

		try {
			const helpEmbed = new EmbedBuilder()
				.setTitle('Overlay Expert')
				.setDescription('To begin helping you, please: ')
				.setColor(Colors.White)
				.addField('1.', 'go live on Twitch', false)
				.addField('2.', 'open your PC web browser or mobile web browser in **desktop mode**', false)
				.addField('3.', 'navigate to your Twitch channel (i.e. `https://twitch.tv/YOUR_USERNAME`)', false)
				.addField('4.', 'take a screenshot and upload it here (screenshots of your extension configuration screen or builder may also be helpful) If you or your viewers are **watching from the Twitch mobile app** or Console, please type `/mobile`.', false)
				.setFooter({ text: `${guild.name}` });

			if (Target && member.permissions.has([PermissionFlagsBits.ManageMessages])) {
				helpEmbed.setAuthor({ name: `${Target.tag}`, iconURL: `${Target.displayAvatarURL({ dynamic: true })}` });
				helpEmbed.setThumbnail(`${Target.displayAvatarURL({ dynamic: true, size: 512 })}`);
				return await interaction.reply({ content: `${Target}`, embeds: [helpEmbed] });
			}
			else {
				helpEmbed.setAuthor({ name: `${user.username}`, iconURL: `${user.displayAvatarURL({ dynamic: true })}` });
				return await interaction.reply({ embeds: [helpEmbed] });
			}
		} catch (error) {
			console.error(error);
		}
	}
};