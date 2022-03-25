const { ButtonInteraction, MessageEmbed, Permissions, PermissionOverwrites } = require('discord.js');
const discordTranscripts = require('discord-html-transcripts');
const DB = require('../../Structures/Schemas/Ticket');
const config = require('../../Structures/config');

module.exports = {
	name: 'interactionCreate',
	Permission: 'ADMINISTRATOR',
	/**
   * @param {ButtonInteraction} interaction 
   */
	async execute(interaction) {
		if (!interaction.isButton()) return;
		const { guild, customId, channel, member } = interaction;
		if(!['close','lock','unlock'].includes(customId)) return;
		if (!member.permissions.has('MANAGE_MESSAGES')) return interaction.reply({ content: 'the buttons are for admins/moderators only', ephemeral: true });
		
		const embed = new MessageEmbed()
			.setColor('BLUE');
		
		DB.findOne({ ChannelID: channel.id }, async(err, docs) => {
			if (err) throw err;
			if (!docs) interaction.reply({ content: 'no data was found related to this ticket, please delete it manually', ephemeral: true });
			switch(customId) {
			case 'lock':
				if (docs.locked == true) return interaction.reply({ content: 'this ticket is already Locked', ephemeral: true });
				await DB.updateOne({ChannelID: channel.id }, { Locked: true });
				embed.setDescription('🔒 | this channel is now locked Pending Review');

				docs.MembersID.forEach((m) => {
					channel.permissionOverwrites.edit(m, {
						SEND_MESSAGES: false,
						EMBED_LINKS: false,
						ATTACH_FILES: false
					});
				});
				interaction.reply({ embeds: [embed] });
				break;
			case 'unlock':
				if (docs.locked == false) return interaction.reply({ content: 'this ticket is already unlocked', ephemeral: true });
				await DB.updateOne({ChannelID: channel.id }, { Locked: false });
				embed.setDescription('🔓 | this channel has been unlocked');
				docs.MembersID.forEach((m) => {
					channel.permissionOverwrites.edit(m, {
						SEND_MESSAGES: true,
						EMBED_LINKS: true,
						ATTACH_FILES: true
					});
				});
				interaction.reply({ embeds: [embed] });	
				break;
			case 'close':
				// await interaction.deferReply();
				if (docs.Closed) return interaction.reply({ content: 'Ticket is already closed, please wait for it to be automatically deleted', ephemeral: true });
				const attachments = await discordTranscripts.createTranscript(channel, {
					limit: -1,
					returnBuffer: false,
					fileName: `${docs.Type} - ${docs.TicketID}.html`,
				});
				await DB.updateOne({ ChannelID: channel.id }, { Closed: true });
				interaction.reply({ content: 'The channel will deleted in 10 seconds.' });
				const Message = await guild.channels.cache.get(config.DISCORD_TRANSCRIPT_ID).send({ embeds: [embed.setTitle(`Transcript Type: ${docs.Type}\nID: ${docs.TicketID}`)], files: [attachments] });
				interaction.followUp({ embeds: [embed.setDescription(`the transcript is now saved [TRANSCRIPT](${Message.url})`)] });
		
				setTimeout(() => {
					channel.delete();
				}, 10 * 1000);
		
				await DB.deleteOne({ ChannelID: channel.id });
				break;
			case 'claim':
				if (docs.Claimed == true) return interaction.reply({ content: `this ticket has already been claimed by <@${docs.ClaimedBy}>`, ephemeral: true });
				await DB.updateOne({ ChannelID: channel.id}, { Claimed: true, ClaimedBy: member.id });

				embed.setDescription(`🛄 | this ticket is now claimed by ${member}`);
				interaction.reply({ embeds: [embed] });
				break;
			}
		});
	}
};