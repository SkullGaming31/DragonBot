const { CommandInteraction, MessageEmbed } = require('discord.js');

module.exports = {
	name: 'info',
	description: 'Get info about a server or a specific user ',
	permission: 'MANAGE_MESSAGES',
	public: true,
	options: [
		{
			name: 'action',
			type: 'STRING',
			description: 'get info on a user or discord server',
			required: true,
			choices: [
				{
					name: 'userinfo',
					value: 'userinfo',
				},
				{
					name: 'serverinfo',
					value: 'serverinfo',
				},
			],
		},
		{
			name: 'member',
			type: 'USER',
			description: 'Used for getting Users Info only, leave out for server info',
			required: false,
		},
	],

	/**
	 * @param {CommandInteraction} interaction
	 * @returns
	 */
	async execute(interaction) {
		const { guild, options, user, member } = interaction;

		const Action = options.getString('action');
		const Target = options.getMember('member') || member;
		await Target.user.fetch();

		try {
			const getPresence = (status) => {
				const statusType = {
					idle: '1FJj7pX.png',
					dnd: 'fbLqSYv.png',
					online: 'JhW7v9d.png',
					invisible: 'dibKqth.png',
				};

				return `https://i.imgur.com/${statusType[status] || statusType['invisible']}`;
			};
			await interaction.deferReply({ ephemeral: true });
			switch (Action) {
				case 'userinfo':
					const response = new MessageEmbed()
						.setColor(Target.user.accentColor || 'RANDOM')
						.setAuthor({ name: Target.user.tag, iconURL: getPresence(Target.presence?.status) })
						.setThumbnail(Target.user.avatarURL({ dynamic: true }))
						.setImage(Target.user.bannerURL({ dynamic: true, size: 512 }) || '')
						.addFields(
							{ name: 'ID', value: Target.user.id },
							{
								name: 'Joined Server',
								value: `<t:${parseInt(Target.joinedTimestamp / 1000)}:R>`,
								inline: true,
							},
							{
								name: 'Account Created',
								value: `<t:${parseInt(Target.user.createdTimestamp / 1000)}:R>`,
								inline: true,
							},
							{
								name: 'Roles',
								value: Target.roles.cache.map((r) => r).sort((a, b) => b.position - a.position).join(' ').replace('@everyone', '') || 'None',
							},
							{
								name: 'Nickname',
								value: Target.nickname || 'None',
								inline: true,
							},
							{
								name: 'Accent Colour',
								value: Target.user.accentColor ? `#${Target.user.accentColor.toString(16)}` : 'None',
								inline: true,
							},
							{
								name: 'Banner',
								value: Target.user.bannerURL() ? '** **' : 'None',
							}
						)
						.setFooter({ text: 'Last Checked' })
						.setTimestamp();
					interaction.editReply({ embeds: [response] });
					break;
				case 'serverinfo':
					const { createdTimestamp, ownerId, description, members, memberCount, channels, emojis, stickers, premiumTier, premiumSubscriptionCount, roles, } = guild;

					const serverInfoEmbed = new MessageEmbed()
						.setColor('BLUE')
						.setAuthor({ name: `${guild.name}`, iconURL: `${guild.iconURL({ dynamic: true }) || ''}` })
						.addFields([
							{
								name: 'GENERAL',
								value: `
									Name: ${guild.name}
									Guild Created: <t:${parseInt(createdTimestamp / 1000)}:R>
									Guild Owner: <@${ownerId}>

									Description: ${description || 'No Description'}
								`,
							},
							{
								name: '👨 | USERS',
								value: `
									- members: ${members.cache.filter((m) => !m.user.bot).size}
									- Bots: ${members.cache.filter((m) => m.user.bot).size}
									- Roles: ${roles.cache.size}

									Total: ${memberCount}
							`,
							},
							{
								name: '🏛 | CHANNELS',
								value: `
									- Text: ${channels.cache.filter((c) => c.type === 'GUILD_TEXT').size}
									- Voice: ${channels.cache.filter((c) => c.type === 'GUILD_VOICE').size}
									- Threads: ${channels.cache.filter((c) => c.type === 'GUILD_NEWS_THREAD' && 'GUILD_PUBLIC_THREAD' && 'GUILD_PRIVATE_THREAD').size}
									- Categories: ${channels.cache.filter((c) => c.type === 'GUILD_CATEGORY').size}
									- Stages: ${channels.cache.filter((c) => c.type === 'GUILD_STAGE_VOICE').size}
									- News: ${channels.cache.filter((c) => c.type === 'GUILD_NEWS').size}

									- Total: ${channels.cache.size}
									`,
							},
							{
								name: '🤯 | EMOJIS & STICKERS',
								value: `
									Animated: ${emojis.cache.filter((e) => e.animated).size}
									Static: ${emojis.cache.filter((e) => !e.animated).size}
									Stickers: ${stickers.cache.size}

									Total: ${stickers.cache.size + emojis.cache.size}
									`,
							},
							{
								name: '✨ | NITRO STATISTICS',
								value: `
									- Tier: ${premiumTier.replace('TIER_', '')}
									- Boosts: ${premiumSubscriptionCount}
									- Boosters: ${members.cache.filter((m) => m.premiumSince).size}
									`,
							},
						])
						.setThumbnail(`${guild.iconURL({ dynamic: true }) || ''}`)
						.setFooter({ text: 'Last Checked' })
						.setTimestamp();

					interaction.editReply({ embeds: [serverInfoEmbed] });
					break;
			}
		} catch (error) {
			console.error(error);
		}
	},
};
