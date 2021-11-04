const { MessageEmbed, Message, TextChannel } = require('discord.js');

module.exports = {
	name: 'messageCreate',
	/**
	 * 
	 * @param {Message} message 
	 * @param {CommandInteraction} interaction
	 * @returns 
	 */
	async execute(message) {
		const linkWhitelist = ['https://twitch.tv/', 'twitch.tv/', 'https://twitter.com/', 'twitter.com/', 'https://instagram.com/', 'instagram.com/', 'https://tiktok.com/', 'tiktok.com/'];
		const targetChannel = message.guild.channels.cache.find(channel => channel.id === '901487955607158847');// Logs Channel
		let foundInText = false;
		const guildName = message.guild.name;

		const nowlive = message.guild.channels.cache.get('900150882409271326'); // now-live ChannelID
		for (const link in linkWhitelist) {
			if (message.content.toLowerCase().includes(linkWhitelist[link].toLowerCase())) { foundInText = true; }
			if (foundInText && message.channelId !== '900150882409271326') {
				try {
					const linkDetection = new MessageEmbed()
						.setTitle('Link Detected')
						.setDescription(`:x: ${message.author} **Links should only be posted in ${nowlive}**`)
						.setColor('RED')
						.setFooter(`${guildName}`)
						.setThumbnail(message.author.avatarURL())
						.setTimestamp(Date.now());
					await message.channel.send({ embeds: [linkDetection] });
					message.delete().catch((e) => { console.log(e); });
					foundInText = false;
					const logsEmbed = new MessageEmbed()
						.setTitle('Automated Message Deletion')
						.setDescription(`${message.author.username} posted ${message.content} in ${message.channel}`)
						.setColor('PURPLE')
						.setTimestamp(Date.now());
					if (targetChannel.isText()) targetChannel.send({ embeds: [logsEmbed] });
					console.log('was ' + foundInText);
				}
				catch (e) {
					console.log(e);
					return;
				}
			}
		}
	},
};