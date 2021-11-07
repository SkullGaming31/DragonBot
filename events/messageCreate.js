const { MessageEmbed, Message, TextChannel, MessageMentions: { USERS_PATTERN, CHANNELS_PATTERN, EVERYONE_PATTERN } } = require('discord.js');

module.exports = {
	name: 'messageCreate',
	/**
	 * 
	 * @param {Message} message 
	 * @param {CommandInteraction} interaction
	 * @returns 
	 */

	async execute(message) {
		const channel = (await message.guild.channels.fetch(message.channel.id)).name;
		console.log(`${message.author.tag} Said: ${message.content} in #${channel}`);

		if (message.channel.type === 'DM' || message.author.bot) return;
		// if (message.member.permissions.has('MANAGE_MESSAGES')) return; // if they have the manage messages permission ignore wat ever they type.
		const guildName = message.guild.name;
		const mentionedMember = message.mentions.members.first();

		const adminRole = message.guild.roles.cache.get('899658881490374707'); // Admin Role ID
		const modRole = message.guild.roles.cache.get('899658962880835624'); // Moderator Role ID


		if (mentionedMember) { // Anti-Ping System
			if (mentionedMember.roles.cache.has(adminRole.id) || mentionedMember.roles.cache.has(modRole.id)) {
				const supportChannel = message.guild.channels.cache.get('899451865924763682'); // your Discord supportChannel ID
				const warning = new MessageEmbed()
					.setTitle('WARNING')
					.setDescription(`${message.author.tag}, **Please do not ping a mod or admin, leave your question in ${supportChannel} and when someone is free they will help you out, **Remember** we all have lives to live aswell so please be patient, someone will get to you as soon as possible.**`)
					.setColor('RED')
					.setFooter(`${guildName}`)
					.setThumbnail(message.author.avatarURL());
				message.reply({ embeds: [warning] });
			}
		}
		if (!message.member.roles.cache.has(adminRole.id) || !message.member.roles.cache.has(modRole.id)) {// word detection
			if (message.content.includes('help') || message.content.includes('xbox') || message.content.includes('ps4')) {
				const messageEmbed = new MessageEmbed()
					.setTitle(message.author.tag)
					.setDescription('Please run the /get-help Command in this channel for support and follow the bots response!!!')
					.setThumbnail(message.author.displayAvatarURL())
					.setFooter(`${guildName}`);
				message.reply({ embeds: [messageEmbed] });
			}
		}
	},
};