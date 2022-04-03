const { MessageEmbed, Message } = require('discord.js');
const config = require('../../Structures/config');

module.exports = {
	name: 'messageCreate',
	/**
	 * @param {Message} message
	 * @returns 
	 */
	async execute (message) {
		const channel = (await message.guild.channels.fetch(message.channel.id)).name;
		// const mentioned = (await message.guild.members.fetch(message.author.id)).displayName;
		console.log(`${message.author.tag} Said: ${message.content} in #${channel}`);

		if (message.author.bot) return;
		// if (message.member.permissions.has('MANAGE_MESSAGES')) return; // if they have the manage messages permission ignore wat ever they type.
		const guildName = message.guild.name;
		const mentionedMember = message.mentions.members.first();

		const adminRole = message.guild.roles.cache.get(config.DISCORD_ADMIN_ROLE_ID); // Admin Role ID
		const modRole = message.guild.roles.cache.get(config.DISCORD_MOD_ROLE_ID); // Moderator Role ID
		const communitySupport = message.guild.channels.cache.get(config.DISCORD_SUPPORT_CHANNEL_ID);

		if (mentionedMember) { // Anti-Ping System
			if (mentionedMember.roles.cache.has(adminRole.id) || mentionedMember.roles.cache.has(modRole.id)) {
				const warning = new MessageEmbed()
					.setTitle('WARNING')
					.setDescription(`**Please do not ping a Moderator or Admin**, Leave your question in ${communitySupport} and we will get to it as soon as possible`)
					.setColor('RED')
					.setFooter({ text: `${guildName}` })
					.setThumbnail(message.author.avatarURL({dynamic: true}));
				await message.reply({ embeds: [warning], allowedMentions: ['users'] });
				(await message.fetch(true)).id
				setTimeout(() => {
					message.delete();
				}, 1 * 5000);
			}
		}
	},
};