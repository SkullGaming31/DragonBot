const { CommandInteraction, MessageEmbed } = require('discord.js');

module.exports = {
	name: 'userinfo',
	description: 'Display User info',
	permission: 'MANAGE_MESSAGES',
	public: true,
	options: [
		{
			name: 'target',
			description: 'Who do you want to tag in the message',
			type: 'USER',
			required: true
		}
	],
	/**
	 * 
	 * @param {CommandInteraction} interaction 
	 */
	async execute(interaction) {
		const { guild, options, member } = interaction;

		const Target = options.getUser('target');
		const targetUser = guild.members.cache.get(Target.id);
		const joined = await Target.fetch(true);


		try {
			const userInfoEmbed = new MessageEmbed()
				.setTitle('Overlay Expert')
				.setDescription('User Info: ')
				.setAuthor({ name: `${targetUser}`, iconURL: `${targetUser.displayAvatarURL({ dynamic: true })}` })
				.setColor('WHITE')
				.setThumbnail(`${targetUser.displayAvatarURL({ dynamic: true, size: 512 })}`)
				.addFields([
					{
						name: 'ID: ',
						value: `${targetUser.id}`,
						inline: true
					},
					{
						name: 'Roles: ',
						value: `${targetUser.roles.cache.map((r) => r).join(' ').replace('@everyone', '') || 'None'}` /* 'WIP' */,
						inline: true
					},
					{
						name: 'Member Since: ',
						value: `<t:${parseInt(joined)}:R>`,
						inline: true
					},
					{

						name: 'Discord User Since: ',
						value: `<t:${parseInt(targetUser.createdTimestamp / 1000)}:R>`,
						inline: true
					}
				])
				.setFooter({ text: `${guild.name}` });

			if (targetUser && member.permissions.has('MANAGE_MESSAGES')) {
				interaction.reply({ embeds: [userInfoEmbed], ephemeral: true });
				// console.log('tag working');
			}
			else {
				console.error;
			}
		} catch (error) {
			console.error(error);
		}
	}
};
