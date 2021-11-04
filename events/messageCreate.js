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
		console.log(`${message.author.tag} Said: ${message.content} in ${message.channel}`);

		if (message.channel.type === 'DM' || message.author.bot) return;
		// if (message.member.permissions.has('MANAGE_MESSAGES')) return;// if they have the manage messages permission ignore wat ever they type.
		const guildName = message.guild.name;
		const mentionedMember = message.mentions.members.first();

		const adminRole = message.guild.roles.cache.get('899658881490374707'); // Admin Role ID
		const modRole = message.guild.roles.cache.get('899658962880835624'); // Moderator Role ID
		const ownerRole = message.guild.roles.cache.get('883536958595411968');// Owner Role ID


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