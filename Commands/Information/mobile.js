const { CommandInteraction, MessageEmbed } = require('discord.js');

module.exports = {
	name: 'mobile',
	description: 'information about why twitch extensions dont work on Mobile',
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
	 * @param {CommandInteraction} interaction 
	 */
	async execute(interaction) {
		const { options, guild } = interaction;

		const Target = options.getUser('target');

		try {

			const mobileEmbed = new MessageEmbed()
				.setTitle('Mobile Help')
				.setColor('BLUE')
				.addFields([
					{
						name: '**READ**',
						value: 'No Twitch Extension can overlay the video on mobile; this is a limitation of the Twitch Extension Platform itself and not of Overlay Expert. Until Twitch improves the Extension Platform and allows extensions to overlay the video on mobile, you can use the **mobile chat view** that when activated will appear below your video and show alerts over your chat or ask your community to view your stream from a **mobile browser in "desktop mode"**.',
						inline: false
					},
					{
						name: 'Voting For Twitch to Improve: ',
						value: 'You can also: Vote for this Twitch suggestion https://twitch.uservoice.com/forums/904711-extensions/suggestions/40301335 Contact Twitch Support https://help.twitch.tv/s/contactsupport and request better extension support on mobile For more information, see https://github.com/overlay-expert/help-desk/issues/97.',
						inline: false
					}
				])
				.setFooter({ text: `${guild.name}` })
				.setTimestamp();

			if (Target) {
				await interaction.reply({ content: `@${Target.tag}`, embeds: [mobileEmbed] });
			} else {
				await interaction.reply({ embeds: [mobileEmbed] });
			}
		} catch (error) {
			console.error(error);
		}
	}
};