const { MessageEmbed, Message } = require('discord.js');
const DB = require('../../Structures/Schemas/settingsDB');

module.exports = {
	name: 'messageCreate',
	/**
	 * 
	 * @param {Message} message 
	 * @param {CommandInteraction} interaction
	 * @returns 
	 */
	async execute(message) {
		const { guild } = message;
		// const nowLive = process.env.DISCORD_PROMOTE_CHANNEL_ID;
		// const logsChannel = process.env.DISCORD_LOGS_CHANNEL_ID;
		const Data = await DB.findOne({ GuildID: guild.id });
		const linkWhitelist = [
			'https://twitch.tv/', 'twitch.tv/',
			'https://twitter.com/', 'twitter.com/',
			'https://instagram.com/', 'instagram.com/',
			'https://tiktok.com/', 'tiktok.com/',
			'https://github.com/', 'github.com/',
		];
		// if (message.member.permissions.has('MANAGE_MESSAGES')) return;
		const logsChannel = guild.channels.cache.get(Data.LoggingChannel);// Logs Channel
		let foundInText = false;

		const nowLive = guild.channels.cache.get(Data.PromotionChannel); // now-live ChannelID
		for (const link in linkWhitelist) {
			if (message.author.bot) return;
			if (message.content.toLowerCase().includes(linkWhitelist[link].toLowerCase())) { foundInText = true; }
			if (foundInText && message.channelId !== nowLive) {// NOW LIVE Channel ID
				try {
					const linkDetection = new MessageEmbed()
						.setTitle('Link Detected')
						.setDescription(`:x: ${message.author} **Links should only be posted in ${nowLive}**`)
						.setColor('RED')
						.setFooter({ text: `${guild.name}` })
						.setThumbnail(message.author.avatarURL())
						.setTimestamp(Date.now());

					await message.channel.send({ embeds: [linkDetection] });
					message.delete().catch((e) => { console.error(e); });
					foundInText = false;

					const logsEmbed = new MessageEmbed()
						.setTitle('Automated Message Deletion')
						.addFields([
							{
								name: 'User',
								value: `${message.author.username}`
							},
							{
								name: 'Message',
								value: `${message.content}`
							},
							{
								name: 'Channel',
								value: `${message.channel}`
							}
						])
						.setColor('PURPLE')
						.setTimestamp(Date.now());
					if (logsChannel.isText()) await logsChannel.send({ embeds: [logsEmbed] });
					if (!foundInText) break;
				}
				catch (e) {
					console.log(e);
					return;
				}
			}
		}
	},
};