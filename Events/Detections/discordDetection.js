const { Message, EmbedBuilder, Colors } = require('discord.js');
const DB = require('../../Structures/Schemas/settingsDB');

module.exports = {
	name: 'messageCreate',
	/**
	 * 
	 * @param {Message} message 
	 * @returns 
	 */
	async execute(message) {
		const { guild, channel, author } = message;
		if (author.bot) return;
		let sentInText = false;

		const discordInviteList = [
			'discord.com/', 'discord.gg/',
			'https://discord.com/', 'https://discord.gg/',
			'.gift'
		];

		try {
			for (const dInvite in discordInviteList) {// discord link detection
				if (message.content.toLowerCase().includes(discordInviteList[dInvite].toLowerCase())) { sentInText = true; }
				if (sentInText) {
					const discordLinkDetection = new EmbedBuilder()// sends to the channel the link was posted too.
						.setTitle('Discord Link Detected')
						.setDescription(`:x: ${author} **Do not post discord links in this server.**`)
						.setColor(Colors.Red)
						.setAuthor({ name: author.tag, iconURL: author.avatarURL({ size: 512 }) })
						.setThumbnail(author.avatarURL({ size: 512 }))
						.setFooter({ text: `UserID: ${author.id}`, iconURL: author.avatarURL({ size: 512 }) })
						.setImage(guild.iconURL({ size: 512, extension: 'webp' | 'png' | 'jpg' | 'jpeg' | 'gif' }))
						.setTimestamp();

					if (guild.ownerId === author.id || author.id === '353674019943219204' || author.id === '557517338438664223') return;
					// if (admin || mod) return;
					if (channel.id === '713791344803577868' || channel.id === '959693430647308292') {// channel(s) you dont want the bot to delete discord links from
						return;
					} else {
						channel.send({ content: `${message.author}`, embeds: [discordLinkDetection] }); // send this warning embed to the channel the link was detected in
						await message.delete().catch((error) => { console.error(error); return; });
						sentInText = false;
					}
				}
			}
		} catch (error) {
			console.error(error);
			return;
		}
	},
};