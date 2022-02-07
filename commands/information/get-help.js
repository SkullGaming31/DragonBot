const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, CommandInteraction } = require('discord.js');

/**
* @params {interactionCreate} interaction
*/
module.exports = {
	name: 'get-help',
	data: new SlashCommandBuilder()
		.setName('get-help')
		.setDescription('get help for an issue your having with overlay expert')
		.addUserOption(option => option.setName('user')
			.setDescription('the user you want to mention')
			.setRequired(false)),
	/**
	* 
	* @param {CommandInteraction} interaction
	* @returns
	*/
	async execute(interaction) {
		const guildName = interaction.guild.name;
		const user = interaction.options.getUser('user');

		const helpEmbed = new MessageEmbed()
			.setDescription('To begin helping you, please: ')
			.setColor('WHITE')
			.addField('1.', 'go live on Twitch', false)
			.addField('2.', 'open your PC web browser or mobile web browser in **desktop mode**', false)
			.addField('3.', 'navigate to your Twitch channel (i.e. `https://twitch.tv/YOUR_USERNAME`)', false)
			.addField('4.', 'take a screenshot and upload it here (screenshots of your extension configuration screen or builder may also be helpful) If you or your viewers are **watching from the Twitch mobile app** or other device, please type `/mobile`.', false)
			.setFooter(`${guildName}`);
		if (user) {
			await interaction.deferReply();
			helpEmbed.setTitle(`**_${user.username}_**`);
			interaction.editReply({ content: `${user}`, embeds: [helpEmbed] });
		}
		else {
			await interaction.deferReply();
			helpEmbed.setTitle(`${interaction.user.username}`);
			interaction.editReply({ embeds: [helpEmbed] });
		}
	},
};