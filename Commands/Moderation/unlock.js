const { CommandInteraction, MessageEmbed } = require('discord.js');
const DB = require('../../Structures/Schemas/LockDownDB');

module.exports = {
  name: 'unlock',
  description: 'unlock this channel',
  permission: 'MANAGE_CHANNELS',
  public: true,
  /**
   * 
   * @param {CommandInteraction} interaction 
   */
  async execute(interaction) {
    const { guild, channel } = interaction;

    const Embed = new MessageEmbed();

    if (channel.permissionsFor(guild.id).has('SEND_MESSAGES')) return interaction.reply({ embeds: [Embed.setColor('RED').setDescription('⛔ | this channel is already unlocked')], ephemeral: true });

    channel.permissionOverwrites.edit(guild.id, {
      SEND_MESSAGES: null
    });
    await DB.deleteOne({ ChannelID: channel.id })

    interaction.reply({ embeds: [Embed.setColor('GREEN').setDescription(`🔓 | The lockdown has been lifted`)] });
  }
}