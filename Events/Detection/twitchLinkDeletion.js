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
		if (!Data) return;
		if (message.author.bot) return;

		const linkWhitelist = [// links that will be aloud to be sent in a promo channel
			'https://twitch.tv/', 'twitch.tv/',
			'https://api.twitch.tv/', 'api.twitch.tv',
			'https://twitter.com/', 'twitter.com/',
			'https://instagram.com/', 'instagram.com/',
			'https://tiktok.com/', 'tiktok.com/',
			'https://github.com/', 'github.com/',
		];
		const logsChannel = guild.channels.cache.get(Data.LoggingChannel); // Logs Channel, remove Data.LoggingChannel if you dont have your logs channel saved in a db and replace it with 'Your Channel ID'
		let foundInText = false;

		const nowLive = guild.channels.cache.get(Data.PromotionChannel); // now-live ChannelID
		if (member.permissions.has('MANAGE_MESSAGES') ? true : null) return;// if they have the manage messages permission ignore them
		if (channel.id === '713791344803577868' || channel.id === '959693430647308292') return;// added these cause the bot was deleting messages in the moderator chat
		/* havnt figure out the new permission system yet for dening the bot moderating messages */
		if (channel.parentId === '694243745717288971' || channel.parentId === '959693430647308289') return; // parent channel id for ticket system if you have one, if not delete this line

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

					await message.reply({ embeds: [linkDetection] });
					message.delete().catch((e) => { console.error(e); });
					foundInText = false;

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
