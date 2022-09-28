import { ChannelType, Colors, EmbedBuilder, GuildBan } from "discord.js";
import { Event } from "../../../src/Structures/Event";
import ChanLogger from '../../Structures/Schemas/LogsChannelDB';// DB
import GenLogs from '../../Structures/Schemas/GeneralLogsDB'; //SwitchDB

export default new Event('guildBanRemove', async (ban: GuildBan) => {
  const { guild, user } = ban;

  const logsChannel = '959693430647308295';
  const Channel = guild.channels.cache.get(logsChannel);
  if (!Channel) return;

  if (Channel.type === ChannelType.GuildText)
    return Channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle('User Banned')
          .setDescription(`\`${user.username}#${user.discriminator}\`(${user.id}) has been removed from the ban list for this server`)
          .setTimestamp()
      ]
    });
});