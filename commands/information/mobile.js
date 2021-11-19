const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, CommandInteraction } = require('discord.js');

module.exports = {
	name: 'mobile',
	data: new SlashCommandBuilder()
		.setName('mobile')
		.setDescription('info to relay to overlay expert users')
		.addUserOption(option => option.setName('target')
			.setDescription('The user you want to mention')),
	/**
	* 
	* @param {CommandInteraction} interaction 
	*/
	async execute(interaction) {
		const guildName = interaction.guild.name;
		const target = interaction.options.getUser('target');

		const mobileEmbed = new MessageEmbed()
			.setDescription('No Twitch Extension can overlay the video on mobile; this is a limitation of the Twitch Extension Platform itself and not of Overlay Expert. Until Twitch improves the Extension Platform and allows extensions to overlay the video on mobile, you can use the **mobile chat view** that when activated will appear below your video and show alerts over your chat or ask your community to view your stream from a **mobile browser in "desktop mode"**. You can also: Vote for this Twitch suggestion https://twitch.uservoice.com/forums/904711-extensions/suggestions/40301335 Contact Twitch Support <https://help.twitch.tv/s/contactsupport> and request better extension support on mobile For more information, see <https://github.com/overlay-expert/help-desk/issues/97>.')
			.setColor('PURPLE')
			.setFooter(`${guildName}`);
			
		if (target) {
			mobileEmbed.setTitle(`${target.tag}`);
			await interaction.reply({ content: `${target}`, embeds: [mobileEmbed] });
		}
		else {
			mobileEmbed.setTitle('Overlay Expert');
			await interaction.reply({ embeds: [mobileEmbed] });
		}
	},
};