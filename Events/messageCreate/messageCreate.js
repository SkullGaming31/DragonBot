const { MessageEmbed, Message } = require('discord.js');
const DB = require('../../Structures/Schemas/settingsDB');

module.exports = {
	name: 'messageCreate',
	/**
	 *
	 * @param {Message} message
	 * @returns
	 */
	async execute(message) {
		const channel = (await message.guild.channels.fetch(message.channel.id))
			.name;
		// const mentioned = (await message.guild.members.fetch(message.author.id)).displayName;
		console.log(`${message.author.tag} Said: ${message.content} in #${channel}`);

		if (message.author.bot) return;
		const { author, guild } = message;
		// if (message.member.permissions.has('MANAGE_MESSAGES')) return; // if they have the manage messages permission ignore wat ever they type.
		const guildName = message.guild.name;
		const mentionedMember = message.mentions.members.first();

		const Data = await DB.findOne({ GuildID: message.guild.id });

		const adminRole = message.guild.roles.cache.get(Data.AdministratorRole); // Admin Role ID
		const modRole = message.guild.roles.cache.get(Data.ModeratorRole); // Moderator Role ID
		const communitySupport = message.guild.channels.cache.get(Data.SupportChannel);

		if (message.content.includes('help') && message.content.endsWith('?')) {
			const response = new MessageEmbed()
				.setColor('RANDOM')
				.setAuthor({ name: `${author.username}`, iconURL: `${author.displayAvatarURL({ dynamic: true })}` })
				.setDescription(`Someone will be with you as soon as they are free remember we have lives just like you, 
													to help us out please provide as much information as you can about your issue`)
				.setFooter({ text: `${guild.name}` })
				.setTimestamp();
			message.reply({ embeds: [response] });
		}

		/* if (mentionedMember) { // Anti-Ping System
			if (mentionedMember.roles.cache.has(adminRole.id) || mentionedMember.roles.cache.has(modRole.id)) {
				const warning = new MessageEmbed()
					.setTitle('WARNING')
					.setDescription(`**Please do not ping a Moderator or Admin**, Leave your question in ${communitySupport} and we will get to it as soon as possible`)
					.setColor('RED')
					.setFooter({ text: `${guildName}` })
					.setThumbnail(message.author.avatarURL({ dynamic: true }));
				await message.reply({ embeds: [warning], allowedMentions: ['users'] });
				setTimeout(() => {
					message.delete();
				}, 1 * 5000);
			}
		} */
	},
};
