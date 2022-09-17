const { GuildMember, EmbedBuilder } = require('discord.js');
const DB = require('../../Structures/Schemas/settingsDB');

module.exports = {
	name: 'guildMemberAdd',

	/**
	 * 
	 * @param {GuildMember} member 
	 */
	async execute(member) {
		try {
			const { guild, user } = member;
			const Data = await DB.findOne({ GuildID: guild.id });
			const Channel = guild.channels.cache.get(Data.WelcomeChannel);

			if (!Channel) return;

			// console.log(member);
			const faq = guild.channels.cache.get('959693430244642820');
			const Embed = new EmbedBuilder()
				.setTitle('NEW MEMBER')
				.setDescription(`Please make sure to check the ${faq} for your issue before posting in the support section, this will save you alot of waiting if your answer is already posted.`)
				.setAuthor({ name: user.tag, iconURL: member.displayAvatarURL({ size: 512 }) })
				.setColor('Blue')
				.addFields([
					{
						name: 'Account Created: ',
						value: `<t:${parseInt(user.createdTimestamp / 1000)}:R>`,
						inline: true
					},
					{
						name: 'Latest Member Count: ',
						value: `${guild.memberCount}`,
						inline: true
					}
				])
				.setThumbnail(guild.iconURL({ size: 512 }))
				.setFooter({ text: `UserID: ${member.id}` })
				.setTimestamp();

			if (Data.Welcome === true) {
				Channel.send({ content: `Welcome ${member}`, embeds: [Embed] });
			} else return;
		} catch (error) {
			console.error(error);
			return;
		}
	}
};