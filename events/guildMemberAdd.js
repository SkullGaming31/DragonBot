const { MessageEmbed, GuildMember } = require('discord.js');
module.exports = {
    name: 'guildMemberAdd',
    execute(message) {

        if (message.channel.type === 'dm' && message.author.bot) return;
        /*
        needs to test the welcome/welcome embed sending to the correct channel.
        
        welcome message with embed
        assign GamersCorner Role to all members that join
        send the welcome message to the #welcome channel
        */
        const rules = message.guild.channels.cache.get('885315675713830912'); //rulesChannel ID
        const welcome = message.guild.channel.cache.get('883535013684056165');
        const guildName = Guild.name;
        const welcomeEmbed = new MessageEmbed()
            .setTitle(`WELCOME to ${guildName}`)
            .setDescription(`${message.author.tag}, **Welcome to the GamersCorner Discord, please read all the rules in the rules channel ${rules} and dont forget to assign your roles so you can see the proper channels**`)
            .setColor('RED')
            .setFooter('GamersCorner')
            .addFields({
                name: 'MemberCount: ',
                value: Guild.memberCount()
            })
            .setThumbnail(message.author.avatarURL());
        message.reply({ content: ' ', embeds: [welcomeEmbed] })

        GuildMember.role.add('883536758749429760').send(welcome);
    }
}