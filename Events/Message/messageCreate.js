const { Client, Message, EmbedBuilder, ChannelType, Colors } = require('discord.js');
const DB = require('../../Structures/Schemas/settingsDB');

module.exports = {
	name: 'messageCreate',
	/**
	 *
	 * @param {Message} message
	 * @param {Client} client
	 * @returns
	 */
	async execute(message, client) {
		// const channels = (await message.guild.channels.fetch(message.channel.id)).name;
		const { author, guild, member, channel, content } = message;
		const { user } = client;

		// console.log(`${author.username} Said: ${content} in #${channels}`);


		if (message.author.bot || channel.type === ChannelType.DM) return;
		if (member.permissions.has(['Administrator', 'ManageMessages'])) return;

		if (message.content.includes('help') && message.content.endsWith('?')) {
			const response = new EmbedBuilder()
				.setColor(Colors.NotQuiteBlack)
				.setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) })
				.setDescription(`Mention ${user.username} for help`)
				.setFooter({ text: `GuildID: ${guild.id}, UserID: ${author.id}` })
				.setTimestamp();
			message.reply({ embeds: [response] });
		}
	},
};