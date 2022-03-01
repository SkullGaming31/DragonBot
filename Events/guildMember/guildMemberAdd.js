const { MessageEmbed, GuildMember, WebhookClient, Interaction } = require('discord.js');
module.exports = {
	name: 'guildMemberAdd',
	/**
	 * 
	 * @param {GuildMember} member 
	 */
	async execute (member) { // create Webhook in Overlay Expert for Welcomeing People into the discord
		console.log('New Member Joined: ', member);
		const { user, guild } = member;

		// https://discord.com/api/webhooks/943187398190305352/hVmO-pVBJpd5lUlAgF5kBkMld2Iqo_ZcSh79Y0dCHuG50O5J_tF_qAFC2aQH9I40LMFg
		member.roles.add('799629973270298675');
		const Welcomer = new WebhookClient({
			id: '943187398190305352',
			token: 'hVmO-pVBJpd5lUlAgF5kBkMld2Iqo_ZcSh79Y0dCHuG50O5J_tF_qAFC2aQH9I40LMFg'
		});
		const Welcome = new MessageEmbed()
			.setColor('#32CD32')
			.setAuthor({ name: user.tag, iconURL: user.avatarURL({ dynamic: true }) })
			.setThumbnail(`${user.avatarURL({ dynamic: true })}`)
			.setDescription(`Welcome ${member} to the **${guild.name}**\n
			Account Created: <t${parseInt(user.createdTimestamp / 1000)}:R>\nLatest Member Count: **${guild.memberCount}**`)
			.setFooter({ text: `ID: ${user.id}`, iconURL: `${guild.iconURL({ dynamic: true })}` });

		Welcomer.send({ embeds: [Welcome]});
	},
};