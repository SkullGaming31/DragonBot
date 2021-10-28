const { MessageEmbed, Message, TextChannel } = require('discord.js');

module.exports = {
	name: 'messageCreate',
	/**
	 * 
	 * @param {Message} message 
	 * @returns 
	 */
	async execute(message) {
		console.log(`${message.author.tag} Said: ${message.content}`);
		let foundInText = false;
		let sentInText = false;
		const targetChannel = message.guild.channels.cache.find(channel => channel.id === '901487955607158847');// Logs Channel

		if (message.channel.type === 'DM' || message.author.bot) return;
		// if (message.member.permissions.has('MANAGE_MESSAGES')) return;// if they have the manage messages permission ignore wat ever they type.
		const guildName = message.guild.name;
		const mentionedMember = message.mentions.members.first();
		const adminRole = message.guild.roles.cache.get('899658881490374707'); // Admin Role ID
		const modRole = message.guild.roles.cache.get('899658962880835624'); // Moderator Role ID
		const ownerRole = message.guild.roles.cache.get('883536958595411968');// Owner Role ID
		const linkWhitelist = ['https://twitch.tv/', 'twitch.tv/', 'https://twitter.com/', 'twitter.com/', 'https://instagram.com/', 'instagram.com/', 'https://tiktok.com/', 'tiktok.com/'];
		const discordInviteList = ['discord.com/invite/', 'discord.com/', 'discord.gg/', 'https://discord.com/invite/', 'https://discord.com/', 'https://discord.gg/', '.gift'];


		for (const dInvite in discordInviteList) {// discord link detection
			if (message.content.toLowerCase().includes(discordInviteList[dInvite].toLowerCase())) { sentInText = true; }
			if (sentInText && !message.author.bot) {
				const discordLinkDetection = new MessageEmbed()// sends to channel link was posted too.
					.setTitle('Discord Link Detected')
					.setDescription(`${message.author} **Do not post discord links in this server.**`)
					.setColor('RED')
					.setFooter(`${guildName}`)
					.setThumbnail(message.author.avatarURL())
					.setTimestamp(Date.now());
				await message.channel.send({ embeds: [discordLinkDetection] });
				message.delete().catch(console.log(console.error));
				sentInText = false;
				const logsEmbed = new MessageEmbed()// sends to logs channel
					.setTitle('Automated Message Deletion')
					.setDescription(`${message.author.username} posted ${message.content} in ${message.channel}`)
					.setColor('PURPLE')
					.setTimestamp(Date.now());
				if (targetChannel.isText()) targetChannel.send({ embeds: [logsEmbed] });
			}
		}

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
					message.delete().catch(() => { console.log(console.error); });
					// console.log(link);
					// console.log(linkWhitelist);
					const logsEmbed = new MessageEmbed()
						.setTitle('Automated Message Deletion')
						.setDescription(`${message.author.username} posted ${message.content} in ${message.channel}`)
						.setColor('PURPLE')
						.setTimestamp(Date.now());
					if (targetChannel.isText()) targetChannel.send({ embeds: [logsEmbed] });
					foundInText = false;
				}
				catch (e) {
					console.log(e);
				}
			}
		}

		if (mentionedMember) { // Anti-Ping System works
			if (mentionedMember.roles.cache.has(adminRole.id) || mentionedMember.roles.cache.has(modRole.id) || mentionedMember.roles.cache.has(ownerRole.id)) {
				const supportChannel = message.guild.channels.cache.get('899451865924763682'); // supportChannel ID
				const warning = new MessageEmbed()
					.setTitle('WARNING')
					.setDescription(`${message.author.tag}, **Please do not ping a mod or admin, leave your question in ${supportChannel} and when someone is free they will help you out, remember we all have lives to live aswell so please be patient, someone will get to you as soon as possible.**`)
					.setColor('RED')
					.setFooter(`${guildName}`)
					.setThumbnail(message.author.avatarURL());
				message.reply({ content: `${message.author.tag}`, embeds: [warning] });
			}
		}
		if (!message.member.roles.cache.has(adminRole.id) || !message.member.roles.cache.has(modRole.id)) {// word detection
			if (message.content.includes('help') || message.content.includes('xbox') || message.content.includes('ps4')) {
				const messageEmbed = new MessageEmbed()
					.setTitle(message.author.tag)
					.setDescription(' ')
					.setThumbnail(message.author.displayAvatarURL())
					.setFooter(`${guildName}`)
					.addField('test', 'test', false);
				message.channel.send({ content: ' ', embeds: [messageEmbed] });
			}
		}
	},
};