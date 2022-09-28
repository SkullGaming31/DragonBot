import { ChannelType, Colors, EmbedBuilder, Role } from "discord.js";
import { Event } from "../../../src/Structures/Event";
import ChanLogger from '../../Structures/Schemas/LogsChannelDB';// DB
import GenLogs from '../../Structures/Schemas/GeneralLogsDB'; //SwitchDB

export default new Event('roleDelete', async (role: Role) => {
  const { guild, name } = role;

  const logsChannel = '959693430647308295';
  const Channel = guild.channels.cache.get(logsChannel);
  if (!Channel) return;

  const Embed = new EmbedBuilder()
    .setColor(Colors.Red)
    .setTimestamp();

  if (Channel.type === ChannelType.GuildText)
    return Channel.send({
      embeds: [
        Embed.setTitle(`${guild.name} | Role Deleted`),
        Embed.setDescription(`a role has been Deleted named: ${role}, \`${name}\``)
      ]
    });
});