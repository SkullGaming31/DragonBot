const { CommandInteraction, MessageEmbed, WebhookClient } = require('discord.js');
const DB = require('../../Structures/Schemas/SuggestDB');

module.exports = {
	name: 'suggestion',
	description: 'A way to send a suggestion to me for new features',
	permission: 'SEND_MESSAGES',
	public: true,
	options: [
		{
			name: 'type',
			description: 'select the type',
			type: 'STRING',
			required: true,
			choices: [
				{ name: 'Discord', value: 'Discord' },
				// { name: 'Overlay Expert', value: 'Overlay Expert' }
			],
		},
		{
			name: 'suggestion',
			description: 'describe your suggestion in 4096 characters or less',
			type: 'STRING',
			required: true,
		},
	],

	/**
	 *
	 * @param {CommandInteraction} interaction
	 */
	async execute(interaction) {
		const { options, guild, guildId, member, user } = interaction;
		const targetChannel = guild.channels.cache.get('696002201361055794');

		const Type = options.getString('type');
		const Suggestion = options.getString('suggestion');

		const Response = new MessageEmbed()
			.setColor('PURPLE')
			.setAuthor({ name: `${user.username}`, iconURL: `${user.displayAvatarURL({ dynamic: true })}` })
			.addFields(
				{ name: 'Suggestion: ', value: Suggestion, inline: false },
				{ name: 'Type: ', value: Type, inline: true },
				{ name: 'User: ', value: user.tag },
				{ name: 'Guild: ', value: `${guild.name}`, inline: true }
			)
			.setFooter({ text: `GuildID: ${guildId}` })
			.setTimestamp();

		try {
			await interaction.reply({ content: 'Sent, Thank you for your suggestion, i will begin looking into your Sugesstion', ephemeral: true, });
			await DB.create({
				GuildID: guildId,
				Details: [
					{
						MemberID: member.id,
						Type: Type,
						Suggestion: Suggestion,
					},
				],
			});
			if (Type === 'Discord') {
				new WebhookClient({
					id: '961195913311838208',
					token: 'HLBMu6HpnSNMVIDW5Mx1cBK3BOMfnMOub4z6UcTxIs0exl81Vr02t2mnKJweJHfXhadm',
				})
					.send({ embeds: [Response] })
					.catch((err) => { console.error(err); });
			} else if (Type === 'Overlay Expert') {
				if (targetChannel.isText()) return await targetChannel.send({ embeds: [Response] });
				console.log('Overlay Experts has been choosen');
			} else {
				console.log('something went wrong');
			}
		} catch (error) {
			console.log(error);
		}
	},
};
