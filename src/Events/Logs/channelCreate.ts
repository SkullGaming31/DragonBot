import { ChannelType, Colors, EmbedBuilder, GuildChannel } from "discord.js";
import { Event } from "../../../src/Structures/Event";
import ChanLogger from '../../Structures/Schemas/LogsChannelDB';// DB
import GenLogs from '../../Structures/Schemas/GeneralLogsDB'; //SwitchDB

export default new Event('channelCreate', async (channel: GuildChannel) => {
  const { guild, name } = channel;

  const logsChannel = '959693430647308295';
  const Channel = guild.channels.cache.get(logsChannel);
  if (!Channel) return;

  if (Channel.type === ChannelType.GuildText)
    return Channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setDescription(`a channel has been created named: ${channel}, **${name}**`)
          .setTimestamp()
      ]
    });
});