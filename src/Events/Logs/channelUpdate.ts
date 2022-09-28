import { ChannelType, Colors, DMChannel, EmbedBuilder, GuildChannel, NonThreadGuildBasedChannel } from "discord.js";
import interactionCreate from "Events/Interaction/interactionCreate";
import { Event } from "../../../src/Structures/Event";
import ChanLogger from '../../Structures/Schemas/LogsChannelDB';// DB
import GenLogs from '../../Structures/Schemas/GeneralLogsDB'; //SwitchDB

export default new Event('channelUpdate', async (oldChannel: DMChannel | NonThreadGuildBasedChannel, newChannel: DMChannel | NonThreadGuildBasedChannel) => {
  if (newChannel.isDMBased()) return;
  // const { guild, name } = newChannel;

  // const logsChannel = '959693430647308295';
  // const Channel = guild.channels.cache.get(logsChannel);
  // if (!Channel) return;

  // if (Channel.type === ChannelType.GuildText)
  //   if (oldChannel.topic !== newChannel.topic) {
  //     return Channel.send({
  //       embeds: [
  //         new EmbedBuilder()
  //           .setColor(Colors.Red)
  //           .setTitle(`${guild.name} | Topic Updated`)
  //           .setDescription(`${newChannel}'s Topic has been changed from \`${oldChannel.topic}\` to \`${newChannel.topic}\``)
  //           .setTimestamp()
  //       ]
  //     });
  //   }
});