import { EmbedBuilder, Colors, GuildMember, GuildChannel, ChannelType } from "discord.js";
import { Event } from "../../../src/Structures/Event";
import ticket from '../../Structures/Schemas/ticketSetupDB';
import DB from '../../Structures/Schemas/ticketDB';

export default new Event('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.inCachedGuild()) return;

  const { guild, customId, channel, member } = interaction;
  if (!['close', 'lock', 'unlock', 'claim'].includes(customId)) return;

  const TicketSetup = await ticket.findOne({ GuildID: guild.id });
  if (!TicketSetup)
    return interaction.reply({ content: 'the data for this system is outdated' });
  // const adminRole = '959693430244642816';// test server
  // const moderatorRole = '959693430227894300';// test server
  const adminRole = '186117711611428866';// mainServer
  const moderatorRole = '708768425388015728';// mainServer
  if (!member.permissions.has(adminRole) || !member.permissions.has(moderatorRole))
    return interaction.reply({ content: `you must have the <@&${adminRole}> or <@&${moderatorRole}> role to interact with these buttons`, ephemeral: true });

  const embed = new EmbedBuilder().setColor(Colors.Blue);

  DB.findOne({ ChannelID: channel?.id }, async (err: any, docs: any) => {
    if (err) throw err;
    if (!docs)
      return interaction.reply({ content: 'no data was found related to this ticket, please delete it manually', ephemeral: true });
    switch (customId) {
      // case 'lock':
      // 	if (docs.locked == true)
      // 		return interaction.reply({ content: 'this ticket is already Locked', ephemeral: true });
      // 	await DB.updateOne({ ChannelID: channel?.id }, { Locked: true });
      // 	embed.setDescription('🔒 | this channel is now locked Pending Review');

      //   if (channel.type === ChannelType.GuildText)
      // 	docs.MembersID.forEach((m: any) => {
      // 		channel?.permissionOverwrites.edit(m, {
      // 			SendMessages: false,
      // 			EmbedLinks: false,
      // 			AttachFiles: false,
      // 		});
      // 	});
      // 	interaction.reply({ embeds: [embed] });
      // 	break;
      // case 'unlock':
      // 	if (docs.locked == false)
      // 		return interaction.reply({ content: 'this ticket is already unlocked', ephemeral: true });
      // 	await DB.updateOne({ ChannelID: channel?.id }, { Locked: false });
      // 	embed.setDescription('🔓 | this channel has been unlocked');
      // 	docs.MembersID.forEach((m: GuildMember) => {
      // 		channel?.permissionOverwrites.edit(m, {
      // 			SendMessages: true,
      // 			EmbedLinks: true,
      // 			AttachFiles: true,
      // 		});
      // 	});
      // 	interaction.reply({ embeds: [embed] });
      // 	break;
      case 'close':
        if (docs.Closed)
          return interaction.reply({ content: 'Ticket is already closed, please wait for it to be automatically deleted', ephemeral: true });
        await DB.updateOne({ ChannelID: channel?.id }, { Closed: true });
        // const Message = await guild.channels.cache.get(TicketSetup.Transcripts).send({ embeds: [embed.setTitle(`Transcript Type: ${docs.Type}\nID: ${docs.TicketID}`)], files: [attachments] });
        interaction.reply({ content: 'The channel will deleted in 10 seconds.', /* embeds: [embed.setDescription(`the transcript is now saved [TRANSCRIPT](${Message.url})`),], */ });
        setTimeout(() => {
          channel?.delete().catch((err: any) => { console.error(err); });
        }, 10 * 1000);

        await DB.deleteOne({ ChannelID: channel?.id });
        break;
      case 'claim':
        if (docs.Claimed == true)
          return interaction.reply({ content: `this ticket has already been claimed by <@${docs.ClaimedBy}>`, ephemeral: true });
        await DB.updateOne({ ChannelID: channel?.id }, { Claimed: true, ClaimedBy: member.id });

        embed.setDescription(`🛄 | this ticket is now claimed by ${member}`);
        interaction.reply({ embeds: [embed] });
        break;
    }
  });
});