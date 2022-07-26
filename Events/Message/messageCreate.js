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
		const channels = (await message.guild.channels.fetch(message.channel.id)).name;
		// const mentioned = (await message.guild.members.fetch(message.author.id)).displayName;

		console.log(`${message.author.tag} Said: ${message.content} in #${channels}`);
		const { author, guild, member, channel } = message;
		const { user } = client;

		if (message.author.bot || channel.type === ChannelType.DM) return;
		if (member.permissions.has(['Administrator', 'ManageMessages'])) return;

		if (message.content.includes('help') && message.content.endsWith('?')) {
			const response = new EmbedBuilder()
				.setColor(Colors.NotQuiteBlack)
				.setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ dynamic: true }) })
				.setDescription(`Mention ${user.username} for help`)
				.setFooter({ text: `||GuildID: ${guild.id}, UserID: ${author.id}||` })
				.setTimestamp();
			message.reply({ embeds: [response] });
		}
	},
};