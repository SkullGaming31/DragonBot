const { CommandInteraction, MessageEmbed } = require('discord.js');

module.exports = {
	name: 'userinfo',
	description: 'Display User info',
	permission: 'MANAGE_MESSAGES',
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
		const { guild, user, options, member } = interaction;

		const Target = options.getUser('target');


		try {
			const joined = await Target.fetch(true);
			const userInfoEmbed = new MessageEmbed()
				.setTitle('Overlay Expert')
				.setDescription('User Info: ')
				.setAuthor({ name: `${Target}`, iconURL: `${Target.displayAvatarURL({ dynamic: true, size: 512 })}` })
				.setColor('WHITE')
				.setThumbnail(Target.displayAvatarURL({ dynamic: true, size: 512 }))
				.addFields([
					{
						name: 'ID: ',
						value: `${Target.id}`,
						inline: true
					},
					{
						name: 'Roles: ',
						value: `${Target.user.roles.cache.map(r => r).join(' ').replace('@everyone', '') || 'None'}` /* 'WIP' */,
						inline: true
					},
					{
						name: 'Member Since: ',
						value: `<t:${parseInt(joined)}:R>`,
						inline: true
					},
					{
						name: 'Discord User Since: ',
						value: `<t:${parseInt(Target.createdTimestamp / 1000)}:R>`,
						inline: true
					},
					{
						name: 'Warnings: ',
						value: '0',
						inline: true
					}
				])
				.setFooter({ text: `${guild.name}` });

			if (Target && member.permissions.has('MANAGE_MESSAGES')) {
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