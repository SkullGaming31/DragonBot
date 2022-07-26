const { ChatInputCommandInteraction, EmbedBuilder, ApplicationCommandOptionType, Colors, PermissionsBitField } = require('discord.js');
const superagent = require('node-superfetch');

module.exports = {
	name: 'twitch',
	description: 'Shows users Twitch Stats',
	UserPerms: ['SendMessages'],
	BotPerms: ['ManageMessages'],
	options: [
		{
			name: 'channel',
			description: 'Channel to get twitch info for',
			type: ApplicationCommandOptionType.String,
			required: true
		}
	],
	/**
	 * @param {ChatInputCommandInteraction} interaction 
	 * @returns 
	 */
	async execute(interaction) {
		const { options, member, guild, channel } = interaction;
		const channelName = options.getString('user');
		interaction.deferReply({ ephemeral: true });

		try {
			const Followers = await superagent.get(`https://api.crunchprank.net/twitch/followcount/${channelName.toLowerCase()}`);
			// const Subscribers = await superagent.get(`https://api.crunchprank.net/twitch/subcount/${channelName.toLowerCase()}`);
			const upTime = await superagent.get(`https://api.crunchprank.net/twitch/uptime/${channelName.toLowerCase()}`);
			const accountage = await superagent.get(`https://api.crunchprank.net/twitch/creation/${channelName.toLowerCase()}`);
			const lastGame = await superagent.get(`https://api.crunchprank.net/twitch/game/${channelName.toLowerCase()}`);
			const viewerCount = await superagent.get(`https://api.crunchprank.net/twitch/viewercount/${channelName.toLowerCase()}`);


			const embed = new EmbedBuilder()
				.setTitle(`${channelName}'s Twitch Stats`)
				.setColor(Colors.Purple)
				.addFields([
					{
						name: '❣️ **Followers**:',
						value: `${Followers.text}`
					},
					/* {
						name: '**Subscribers**:',
						value: `${Subscribers.text}`
					}, */
					{
						name: '⬆ **Uptime**:',
						value: `${upTime.text}`
					},
					{
						name: '📝 **Created at**:',
						value: `${accountage.text}`
					},
					{
						name: '⏮️ **Last Game Played**:',
						value: `${lastGame.text}`
					},
					{
						name: '🔴 **Live**:',
						value: `${upTime.text}`
					},
					{
						name: '👁 **CurrentViewers**:',
						value: `${viewerCount.text}`
					}
				])
				// .addField('ㅤ', '[**Support here**](https://discord.gg/zA3fsn7G7M)')
				.setThumbnail('https://pngimg.com/uploads/twitch/twitch_PNG27.png')
				// .setThumbnail(`https://api.crunchprank.net/twitch/avatar/${channelName.toLowerCase()} || 'https://pngimg.com/uploads/twitch/twitch_PNG27.png'`)
				.setURL(`https://twitch.tv/${channelName}`)
				.setFooter({ text: `Requested by ${member.user.tag}`, iconURL: member.user.displayAvatarURL() })
				.setTimestamp();
			interaction.editReply({ embeds: [embed] });

			if (upTime.text === `${channelName} is offline`) {
				upTime.text = 'Offline';
			}
			if (viewerCount.text === `${channelName} is offline`) {
				viewerCount.text = 'Offline';
			}

		} catch (error) {
			console.error(error);
			return interaction.editReply({ content: 'An error occured while fetching Twitch stats.' });
		}
	}
};