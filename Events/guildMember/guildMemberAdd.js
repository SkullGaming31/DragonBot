const { MessageEmbed, GuildMember, WebhookClient } = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  /**
   * 
   * @param {GuildMember} member 
   */
  async execute(member) {
    const Welcomer = new WebhookClient({
      id: '961178781903650836',
      token: 'UgCN44PfPUpy6c4feK5sTTPrzU4g8yABtx3LPyekw4ARwOIBspANb51sDf-ACuM0bT-5'
    });
    const { user, guild } = member;
    await member.user.fetch();

    switch (guild.id) {
      case '959693430227894292':// My Guild ID
        member.roles.add('959693430227894293');
        break;
    }
    const Welcome = new MessageEmbed()
      .setColor(member.user.accentColor ? `#${member.user.accentColor.toString(16)}` : "RANDOM")
      .setAuthor({ name: user.tag, iconURL: user.avatarURL({ dynamic: true }) })
      .setThumbnail(`${user.displayAvatarURL({ dynamic: true })}`)
      .setDescription(`Welcome \`${member.displayName}\` to the **${guild.name}**`)
      .addFields([
        {
          name: 'Account Created: ',
          value: `<t:${parseInt(user.createdTimestamp / 1000)}:R>`,
          inline: true
        },
        {
          name: 'Banner: ',
          value: member.user.bannerURL() ? "** **" : "None",
          inline: true
        }
      ])
      .setFooter({ text: `Latest Member Count: ${guild.memberCount}`, iconURL: `${guild.iconURL({ dynamic: true }) || ''}` });
    switch (guild.id) {
      case '959693430227894292':
        Welcomer.send({ content: `${member}`, embeds: [Welcome] });
        break;
      case '183961840928292865':
        break;
    }
  },
};