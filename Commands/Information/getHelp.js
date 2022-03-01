const { CommandInteraction, MessageEmbed } = require('discord.js');

module.exports = {
	name: 'get-help',
	description: 'get help for an issue your having with overlay expert',
	permission: 'SEND_MESSAGES',
	options: [
		{
			name: 'target',
			description: 'Who do you want to tag in the message',
			type: 'USER',
			required: false
		}
	],
	/**
	 * 
	 * @param {CommandInteraction} interaction 
	 */
	async execute(interaction) {
		const { guild, user, options } = interaction;

		const Target = options.getUser('target');

		try {
			const helpEmbed = new MessageEmbed()
				.setTitle('Overlay Expert')
				.setDescription('To begin helping you, please: ')
				.setColor('WHITE')
				.addField('1.', 'go live on Twitch', false)
				.addField('2.', 'open your PC web browser or mobile web browser in **desktop mode**', false)
				.addField('3.', 'navigate to your Twitch channel (i.e. `https://twitch.tv/YOUR_USERNAME`)', false)
				.addField('4.', 'take a screenshot and upload it here (screenshots of your extension configuration screen or builder may also be helpful) If you or your viewers are **watching from the Twitch mobile app** or Console, please type `/mobile`.', false)
				.setFooter({ text: `${guild.name}` });

			if (Target) {// only sending the bugsFeature embed
				await interaction.deferReply();
				helpEmbed.setAuthor({ name: `**_${Target.username}_**`, iconURL: `${Target.displayAvatarURL({ dynamic: true })}`});
				interaction.editReply({ content: `${Target.tag}`, embeds: [helpEmbed] });
			}
			else {
				await interaction.deferReply();
				helpEmbed.setAuthor({ name: `${user.username}`, iconURL: `${user.displayAvatarURL({ dynamic: true })}`});
				interaction.editReply({ embeds: [helpEmbed] });
			}
		} catch (error) {
			console.error(error);
		}
	}
};