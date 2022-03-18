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
	 * 
	 * @param {CommandInteraction} interaction 
	 */
	async execute(interaction) {
		const { guild, user, options } = interaction;

		const Target = options.getUser('target');

		try {
			const mobileEmbed = new MessageEmbed()
				.setDescription('No Twitch Extension can overlay the video on mobile; this is a limitation of the Twitch Extension Platform itself and not of Overlay Expert. Until Twitch improves the Extension Platform and allows extensions to overlay the video on mobile, you can use the **mobile chat view** that when activated will appear below your video and show alerts over your chat or ask your community to view your stream from a **mobile browser in "desktop mode"**.')
				.setColor('BLUE')
				.addFields([
					{
						name: 'Voting For Twitch to Improve: ',
						value: 'You can also: Vote for this Twitch suggestion https://twitch.uservoice.com/forums/904711-extensions/suggestions/40301335 Contact Twitch Support https://help.twitch.tv/s/contactsupport and request better extension support on mobile For more information, see https://github.com/overlay-expert/help-desk/issues/97.',
						inline: true
					}
				])
				.setFooter({ text: `${guild.name}` });

			await interaction.deferReply();
			if (Target) {
				await interaction.reply({ embeds: [mobileEmbed.setTitle(`${Target.tag}`), mobileEmbed.setAuthor({ name: `${Target.tag}`, iconURL: `${Target.displayAvatarURL({ dynamic: true })}` }),mobileEmbed.setThumbnail(`${Target.displayAvatarURL({ dynamic: true})}`) ] });
			} else {
				await interaction.editReply({ embeds: [mobileEmbed.setTitle(`${guild.name}`), mobileEmbed.setAuthor({ name: `${user.tag}`, iconURL: `${user.displayAvatarURL({ dynamic: true })}` })] });
			}
		} catch (error) {
			console.error(error);
		}
	}
};