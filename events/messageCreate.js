const { MessageEmbed, Message } = require('discord.js');

module.exports = {
	name: 'messageCreate',
	/**
	 * 
	 * @param {Message} message 
	 * @returns 
	 */

	async execute(message) {
		const channel = (await message.guild.channels.fetch(message.channel.id)).name;
		console.log(`${message.author.tag} Said: ${message.content} in #${channel}`);

		if (message.channel.type === 'DM' || message.author.bot) return;
		if (message.member.permissions.has('MANAGE_MESSAGES')) return; // if they have the manage messages permission ignore wat ever they type.
		const guildName = message.guild.name;
		const mentionedMember = message.mentions.members.first();

		const adminRoleID = process.env.ADMIN_ROLE_ID;
		const moderatorRoleID = process.env.MODERATOR_ROLE_ID;
		const adminRole = message.guild.roles.cache.get(adminRoleID); // Admin Role ID
		const modRole = message.guild.roles.cache.get(moderatorRoleID); // Moderator Role ID


		if (mentionedMember) { // Anti-Ping System
			if (mentionedMember.roles.cache.has(adminRole.id) || mentionedMember.roles.cache.has(modRole.id)) {
				const supportChannelID = process.env.SUPPORT_CHANNEL_ID;
				const supportChannel = message.guild.channels.cache.get(supportChannelID); // your Discord supportChannel ID
				const warning = new MessageEmbed()
					.setTitle('WARNING')
					.setDescription(`${message.author.username}, Please do not ping a mod or admin, leave your question in ${supportChannel} and when someone is free they will help you out, **Remember** we all have lives to live aswell so please be patient, someone will get to you as soon as possible.`)
					.setColor('RED')
					.setFooter(`${guildName}`)
					.setThumbnail(message.author.avatarURL());
				await message.reply({ embeds: [warning] });
				message.delete();
			}
		}
		// update .env with admin/moderator role id's to stop mods/admins from recieving a message when they say either of the 3 words
		if (!message.member.roles.cache.has(adminRole.id) || !message.member.roles.cache.has(modRole.id)) {
			if (message.content.includes('help') || message.content.includes('xbox') || message.content.includes('ps4')) {
				const messageEmbed = new MessageEmbed()
					.setTitle(`${message.author.tag}`)
					.setDescription('Please run the /get-help Command in this channel for support and follow the bots response!!!')
					.setThumbnail(message.author.displayAvatarURL())
					.setFooter(`${guildName}`);
				message.reply({ embeds: [messageEmbed] });
			}
		}
	},
};