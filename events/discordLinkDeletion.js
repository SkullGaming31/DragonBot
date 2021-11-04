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
		let sentInText = false;
		const targetChannel = message.guild.channels.cache.find(channel => channel.id === '901487955607158847');// Logs Channel
		const discordInviteList = ['discord.com/invite/', 'discord.com/', 'discord.gg/', 'https://discord.com/invite/', 'https://discord.com/', 'https://discord.gg/', '.gift'];
		const guildName = message.guild.name;

		for (const dInvite in discordInviteList) {// discord link detection
			if (message.content.toLowerCase().includes(discordInviteList[dInvite].toLowerCase())) { sentInText = true; }
			if (sentInText) {
				const discordLinkDetection = new MessageEmbed()// sends to channel the link was posted too.
					.setTitle('Discord Link Detected')
					.setDescription(`:x: ${message.author} **Do not post discord links in this server.**`)
					.setColor('RED')
					.setFooter(`${guildName}`)
					.setThumbnail(message.author.avatarURL())
					.setTimestamp(Date.now());

					
				message.delete().catch((error) => { 
					if (error.code !== 10008) {
						console.error('Failed to delete the message:', error);
					}
					message.channel.send({ embeds: [discordLinkDetection] });
					sentInText = false;

					const logsEmbed = new MessageEmbed()// sends to logs channel
						.setTitle('Automated Message Deletion')
						.setDescription(`${message.author.username} posted ${message.content} in ${message.channel}`)
						.setColor('PURPLE')
						.setTimestamp(Date.now());

					if (targetChannel.isText()) targetChannel.send({ embeds: [logsEmbed] });
				});
			}
		}
	},
};