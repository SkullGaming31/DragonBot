const { CommandInteraction, MessageEmbed } = require('discord.js');
const DB = require('../../Structures/Schemas/LockDownDB');
const ms = require('ms');

module.exports = {
  name: 'lock',
  description: 'lockdown this channel',
  permission: 'MANAGE_CHANNELS',
  public: true,
  options: [
    {
      name: 'time',
      description: 'Expire Date for this lockdown (1m, 1h, 1d)',
      type: 'STRING'
    },
    {
      name: 'reason',
      description: 'Provide a reason for this lockdown',
      type: 'STRING'
    }
  ],
  /**
   * 
   * @param {CommandInteraction} interaction 
   */
  async execute(interaction) {
    const { guild, channel, options } = interaction;

    const Reason = options.getString('reason') || 'No Reason Provided';

    const Embed = new MessageEmbed();

    if (!channel.permissionsFor(guild.id).has('SEND_MESSAGES')) return interaction.reply({ embeds: [Embed.setColor('RED').setDescription('⛔ | this channel is already locked')], ephemeral: true });

    channel.permissionOverwrites.edit(guild.id, {
      SEND_MESSAGES: false
    });
    interaction.reply({ embeds: [Embed.setColor('RED').setDescription(`🔒 | This channel is now under a lockdown for: ${Reason}`)] });
    const Time = options.getString('time');
    if (Time) {
      const ExpireDate = Date.now() + ms(Time);
      DB.create({ GuildID: guild.id, ChannelID: channel.id, Time: ExpireDate });

      setTimeout(async () => {
        channel.permissionOverwrites.edit(guild.id, {
          SEND_MESSAGES: null
        });
        interaction.editReply({ embeds: [Embed.setDescription('🔓 | The lockdown has been lifted').setColor('GREEN')] }).catch((err) => { console.error(err); });
        await DB.deleteOne({ ChannelID: channel.id })
      }, ms(Time));
    }
  }
}