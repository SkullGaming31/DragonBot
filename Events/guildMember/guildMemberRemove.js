/* eslint-disable indent */
const { GuildMember, EmbedBuilder, Colors } = require('discord.js');
module.exports = {
  name: 'guildMemberRemove',
  /**
  * 
  * @param {GuildMember} member 
  */
  async execute(member) {
    const { guild, user } = member;

    // console.log('Member left: ', member);
    const testDiscord = guild.channels.cache.get('959693430647308295');// test discord Logs Channel ID

    const embed = new EmbedBuilder()
      .setTitle('MEMBER LEFT')
      .setColor(Colors.Red)
      .setDescription(`\`${user.username}\` left the server`)
      .setFooter({ text: `||Members ID: ${member.id}||`, iconURL: guild.iconURL({ dynamic: true }) });

    try {
      switch (guild.id) {
        case '959693430227894292':
          await testDiscord.send({ embeds: [embed] });
          break;
      }
    } catch (err) { console.error(err); }
  },
};