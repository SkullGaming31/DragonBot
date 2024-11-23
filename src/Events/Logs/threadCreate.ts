import { AnyThreadChannel, ChannelType, EmbedBuilder, ForumThreadChannel, TextBasedChannel } from 'discord.js';
import { MongooseError } from 'mongoose';

import ChanLogger from '../../Database/Schemas/LogsChannelDB';
import { Event } from '../../Structures/Event';

export default new Event<'threadCreate'>('threadCreate', async (thread: AnyThreadChannel, newlyCreated: boolean) => {
  const { guild } = thread;

  const data = await ChanLogger.findOne({ Guild: guild.id }).catch((err: MongooseError) => console.error(err.message));
  if (!data || data.enableLogs === false) return;

  const logsChannelID = data.Channel;
  if (logsChannelID === undefined) return;
  const logsChannelObj = guild.channels.cache.get(logsChannelID) as TextBasedChannel | undefined;
  if (!logsChannelObj || logsChannelObj.type !== ChannelType.GuildText) return;

  const embed = new EmbedBuilder()
    .setColor('Green')
    .setDescription(`A thread has been created named: ${thread}, **${thread.name}**, Newly Created: ${newlyCreated ? 'Yes' : 'No'}`)
    .setTimestamp();

  await logsChannelObj.send({ embeds: [embed] });
});