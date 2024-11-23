import { AnyThreadChannel, ChannelType, EmbedBuilder, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';
import userMention from '../customMessage/userMention';

export default new Event<'threadUpdate'>('threadUpdate', async (oldThread: AnyThreadChannel, newThread: AnyThreadChannel) => {
  const { guild } = newThread;

  const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => console.error(err.message));
  if (!data || data.enableLogs === false) return;

  const logsChannelID = data.Channel;
  if (logsChannelID === undefined) return;
  const logsChannelObj = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
  if (!logsChannelObj || logsChannelObj.type !== ChannelType.GuildText) return;

  //#region Variables
  const threadStarter = await oldThread.fetchOwner({ cache: true });
  //#endregion

  const embed = new EmbedBuilder()
    .setDescription('A thread name has been updated')
    .setColor('Green')
    .addFields([
      {
        name: 'Thread Starter:',
        value: `${threadStarter?.user?.globalName}`,
        inline: false
      },
      {
        name: 'Thread Name:',
        value: `${oldThread.name} : ${newThread.name}`,
        inline: false
      }
    ])
    .setTimestamp();

  await logsChannelObj.send({ embeds: [embed] });
});