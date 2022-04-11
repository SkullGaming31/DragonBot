const { MessageEmbed, Message } = require('discord.js');
const DB = require('../../Structures/Schemas/settingsDB');
// const tickets = require('../../Structures/Schemas/Ticket');

module.exports = {
	name: 'messageCreate',
	/**
	 *
	 * @param {Message} message
	 * @returns
	 */
	async execute(message) {
		const { guild, member, channel } = message;
		const Data = await DB.findOne({ GuildID: guild.id }); // settings database
		// const ticketData = await tickets.findOne({ GuildID: guild.id, ChannelID: channel.id });
		if (!Data/*  || !ticketData */) return;
		if (message.author.bot) return;

		const linkWhitelist = [
			'https://twitch.tv/', 'twitch.tv/',
			'https://api.twitch.tv/', 'api.twitch.tv',
			'https://twitter.com/', 'twitter.com/',
			'https://instagram.com/', 'instagram.com/',
			'https://tiktok.com/', 'tiktok.com/',
			'https://github.com/', 'github.com/',
		];
		const logsChannel = guild.channels.cache.get(Data.LoggingChannel); // Logs Channel
		let foundInText = false;

		const nowLive = guild.channels.cache.get(Data.PromotionChannel); // now-live ChannelID
		// if (member.permissions.has('MANAGE_MESSAGES') ? true : null) return;
		
		for (const link in linkWhitelist) {
			if (message.content.toLowerCase().includes('https://overlay.expert') || message.content.toLowerCase().includes('overlay.expert')) return;
			if (message.content.toLowerCase().includes(linkWhitelist[link].toLowerCase())) { foundInText = true; }
			if (foundInText && message.channelId !== Data.PromotionChannel) { // NOW LIVE Channel ID
				try {
					const linkDetection = new MessageEmbed()
						.setTitle('Link Detected')
						.setDescription(`:x: ${message.author} **Links should only be posted in ${nowLive}**`)
						.setColor('RED')
						.setFooter({ text: `${guild.name}` })
						.setThumbnail(message.author.avatarURL({ dynamic: true }))
						.setTimestamp(Date.now());

					//FIXME bot deleting links in ticket channel
					// if (message.channelId !== ticketData.ChannelID) {
					await message.reply({ embeds: [linkDetection] });
					message.delete().catch((e) => { console.error(e); });
					foundInText = false;
					/* } else {
						return;
					} */

					const logsEmbed = new MessageEmbed()
						.setTitle('Automated Message Deletion')
						.addFields([
							{
								name: 'User',
								value: `${message.author.username}`,
							},
							{
								name: 'Message',
								value: `${message.content}`,
							},
							{
								name: 'Channel',
								value: `${message.channel}`,
							},
						])
						.setColor('PURPLE')
						.setTimestamp(Date.now());
					if (logsChannel.isText())
						await logsChannel.send({ embeds: [logsEmbed] });
					if (!foundInText) break;
				} catch (e) {
					console.log(e);
					return;
				}
			}
		}
	},
};
