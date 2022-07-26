const { CommandInteraction, EmbedBuilder, Colors } = require('discord.js');
const DB = require('../../Structures/Schemas/LockDownDB');

module.exports = {
	name: 'unlock',
	description: 'unlock the channel',
	UserPerms: ['ManageChannels'],
	BotPerms: ['ManageChannels'],
	/**
	 * 
	 * @param {CommandInteraction} interaction 
	 */
	async execute(interaction) {
		const { guild, channel } = interaction;

		const Embed = new EmbedBuilder();

		if (channel.permissionsFor(guild.id).has(['SendMessages'])) return interaction.reply({
			embeds: [Embed.setColor(Colors.Red).setDescription('⛔ | this channel is already unlocked')], ephemeral: true
		});

		channel.permissionOverwrites.edit(guild.id, { SendMessages: null });
		await DB.deleteOne({ ChannelID: channel.id });

		interaction.reply({
			embeds: [Embed.setColor(Colors.Green).setDescription('🔓 | The lockdown has been lifted')]
		});
	}
};