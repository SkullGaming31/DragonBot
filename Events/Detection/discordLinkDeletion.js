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
		const Data = await DB.findOne({ GuildID: guild.id });
		// const logsChannel = await Data.LoggingChannel;
		let sentInText = false;

		const logsChannel = guild.channels.cache.get(Data.LoggingChannel);
		const discordInviteList = ['discord.com/invite/', 'discord.com/', 'discord.gg/', 'https://discord.com/invite/', 'https://discord.com/', 'https://discord.gg/', '.gift'];

		for (const dInvite in discordInviteList) {// discord link detection
			if (message.content.toLowerCase().includes(discordInviteList[dInvite].toLowerCase())) { sentInText = true; }
			if (sentInText) {
				const discordLinkDetection = new MessageEmbed()// sends to channel the link was posted too.
					.setTitle('Discord Link Detected')
					.setDescription(`:x: ${message.author} **Do not post discord links in this server.**`)
					.setColor('RED')
					.setThumbnail(message.author.avatarURL())
					.setFooter({ text: `${guild.name}` })
					.setTimestamp(Date.now());

				sentInText = false;

				await message.channel.send({ embeds: [discordLinkDetection] }); // send this warning embed to the channel the link was detected in
				message.delete().catch(error => { console.error(error); });


				const logsEmbed = new MessageEmbed()// embed to be sent to the logs channel
					.setTitle('Automated Message Deletion')
					.setDescription(`${message.author.username} posted ${message.content} in ${message.channel}`)
					.setColor('PURPLE')
					.setTimestamp(Date.now());

				if (logsChannel.isText()) await logsChannel.send({ embeds: [logsEmbed] });
			}
		}
	},
};