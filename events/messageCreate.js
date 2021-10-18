const { MessageEmbed, Guild } = require('discord.js');
module.exports = {
	name: 'messageCreate',
	execute(message) {
		console.log(`${message.author.username} said: ${message.content}`);

		if (message.channel.type === 'dm') return;
			if (message.author.bot) return;
				const prefix = '-';
				const guildName = Guild.name;
				const mentionedMember = message.mentions.members.first();
				const adminRole = message.guild.roles.cache.get('899658881490374707'); //Admin Role ID
				const modRole = message.guild.roles.cache.get('899658962880835624'); //Moderator Role ID
				const ownerRole = message.guild.roles.cache.get('883536958595411968');//Owner Role ID
			if (mentionedMember) { // Anti-Ping System
				if (mentionedMember.roles.cache.has(adminRole.id) || mentionedMember.roles.cache.has(modRole.id) || mentionedMember.roles.cache.has(ownerRole.id)) {
					const supportChannel = message.guild.channels.cache.get('899451865924763682'); //supportChannel ID
					const warning = new MessageEmbed()
						.setTitle(`WARNING`)
						.setDescription(`${message.author.tag}, **Please do not ping a mod or admin, leave your question in ${supportChannel} and when someone is free they will help you out, remember we all have lives to live aswell so please be patient, someone will get to you as soon as possible.**`)
						.setColor('RED')
						.setFooter(`${guildName}`)
						.setThumbnail(message.author.avatarURL());
					message.reply({ content: `${message.author.tag}`, embeds: [warning] })
				}
			}
	}
}