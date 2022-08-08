/* eslint-disable indent */
const { GuildMember, WebhookClient, Colors, EmbedBuilder, ChannelType, Client } = require('discord.js');
const config = require('../../Structures/config');

module.exports = {
	name: 'guildMemberAdd',
	/**
	 * @param {GuildMember} member
	 * @param {Client} client 
	 */
	async execute(member, client) {
		const Welcomer = new WebhookClient({
			id: config.DISCORD_WELCOME_WEBHOOK_ID,
			token: config.DISCORD_WELCOME_WEBHOOK_TOKEN
		});
		const { user, guild } = member;


		const Welcome = new EmbedBuilder()
			.setColor(Colors.LightGrey)
			.setAuthor({ name: user.tag, iconURL: user.avatarURL({ dynamic: true }) })
			.setThumbnail(user.displayAvatarURL({ dynamic: true }))
			.setDescription(`Welcome \`${member.displayName}\` to **${guild.name}**`)
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
			.setFooter({ text: `ID: ${user.id}`, iconURL: guild.iconURL({ dynamic: true }) });

		switch (guild.id) {
			case '959693430227894292':// Test Guild ID
				// await guild.channels.cache.get('989115791418994708').setName(`Members: ${guild.memberCount}`);


				Welcomer.send({ content: `${member}`, embeds: [Welcome] });
				break;
		}
	},
};