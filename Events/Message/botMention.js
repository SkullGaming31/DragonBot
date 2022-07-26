const { Client, Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ms = require('ms');
module.exports = {
	name: 'messageCreate',
	/**
	 * 
	 * @param {Message} message 
	 * @param {Client} client
	 */
	async execute(message, client) {
		const { author, guild, content } = message;
		const { user } = client;

		if (!guild || author.bot) return;
		if (content.includes('@here') || content.includes('@everyone')) return;
		if (!content.includes(user.id)) return;

		const embed = new EmbedBuilder()
			.setColor('Green')
			.setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
			.setDescription(`Hi im ${user.username}, to get some help with Overlay Expert please type \`/get-help\` and read what the bot has to say, \n\nthis message will self destruct in 1 minute.`)
			.setThumbnail(user.displayAvatarURL({ dynamic: true }));

		const row = new ActionRowBuilder().addComponents(
			new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setURL('https://github.com/overlay-expert/help-desk/issues')
				.setLabel('OverlayExpert HelpDesk'),
			new ButtonBuilder()
				.setStyle(ButtonStyle.Link)
				.setURL('https://overlay.expert')
				.setLabel('OverlayExpert Website')
		);

		return message.reply({ embeds: [embed], components: [row] }).then(msg =>
			setInterval(() => {
				msg.delete().catch(err => {
					if (err.code !== 10008) return console.error(err);
				});
			}, ms('1m')));
	}
};