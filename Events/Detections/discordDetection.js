const { Client, Message, ChannelType, EmbedBuilder, Colors } = require('discord.js');
const DB = require('../../Structures/Schemas/settingsDB');

module.exports = {
	name: 'messageCreate',
	/**
	 * 
	 * @param {Message} message 
	 * @param {Client} interaction
	 * @returns 
	 */
	async execute(message, client) {
		const { guild, channel, author } = message;
		const Data = await DB.findOne({ GuildID: guild.id });
		let sentInText = false;

		const logsChannel = client.channels.cache.get(Data.LoggingChannel);
		const discordInviteList = [
			'discord.com/', 'discord.gg/',
			'https://discord.com/', 'https://discord.gg/',
			'.gift'
		];

		for (const dInvite in discordInviteList) {// discord link detection
			if (message.content.toLowerCase().includes(discordInviteList[dInvite].toLowerCase())) { sentInText = true; }
			if (sentInText) {
				const discordLinkDetection = new EmbedBuilder()// sends to the channel the link was posted too.
					.setTitle('Discord Link Detected')
					.setDescription(`:x: ${message.author} **Do not post discord links in this server.**`)
					.setColor(Colors.Red)
					.setThumbnail(message.author.avatarURL())
					.setFooter({ text: `${guild.name}` })
					.setTimestamp();

				if (guild.ownerId === message.author.id || message.author.id === '353674019943219204' || message.author.id === '557517338438664223') return;
				// if (admin || mod) return;
				if (channel.id === '713791344803577868' || channel.id === '959693430647308292') {// channel(s) you dont want the bot to delete discord links from
					return;
				} else {
					channel.send({ embeds: [discordLinkDetection] }); // send this warning embed to the channel the link was detected in
					await message.delete().catch((error) => { console.error(error); return; });
					sentInText = false;
				}
			}
		}
	},
};