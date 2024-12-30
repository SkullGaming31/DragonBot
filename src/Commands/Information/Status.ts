import { ApplicationCommandType, ChannelType, EmbedBuilder, version } from 'discord.js';
import { connection } from 'mongoose';
import os from 'os';
import { Command } from '../../Structures/Command';

export default new Command({
	name: 'status',
	description: 'Displays the status of the client and database.',
	UserPerms: ['ManageMessages'],
	BotPerms: ['ManageMessages'],
	defaultMemberPermissions: ['ManageMessages'],
	type: ApplicationCommandType.ChatInput,
	Category: 'Information',
	run: async ({ interaction, client }) => {
		if (!interaction.inGuild()) return;
		await client.user?.fetch();
		await client.application?.fetch();

		await interaction.deferReply({ ephemeral: true });

		const getChannelTypeSize = (type: ChannelType[]) => client.channels.cache.filter((channel) => type.includes(channel.type)).size;

		const { user } = client;

		const status = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];

		if (user?.createdTimestamp === undefined) return;
		if (client.readyTimestamp === null) return;
		if (interaction.client.application.owner === null) return;

		const embed = new EmbedBuilder()
			.setColor('Blue')
			.setTitle(`🍞 ${user?.username} Status`)
			.setThumbnail(`${user?.displayAvatarURL({ size: 512 })}`)
			.setDescription(`${interaction.client.application?.description || 'No Bot Description Set'}`)
			.addFields(
				{ name: '👩🏻‍🔧 Client', value: `${user?.username}` },
				{ name: '📆 Created', value: `<t:${parseInt(`${user?.createdTimestamp / 1000}`)}:R>`, inline: true },
				{ name: '☑ Verified', value: user?.flags?.has('VerifiedBot') ? 'Yes' : 'No', inline: true },
				{ name: '👩🏻‍💻 Bot Owner', value: `${interaction.client.user.username || 'None'}`, inline: true },
				{ name: '📚 Database', value: status[connection.readyState], inline: true },
				{ name: '🖥 System', value: os.type().replace('Windows_NT', 'Windows').replace('Darwin', 'macOS'), inline: true },
				{ name: '🧠 CPU Model', value: `${os.cpus()[0].model}`, inline: true },
				{ name: '💾 CPU Usage', value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}%`, inline: true },
				{ name: '⏰ Up Since', value: `<t:${parseInt(`${client.readyTimestamp / 1000}`)}:R>`, inline: true },
				{ name: '👩🏻‍🔧 Node.js', value: process.version, inline: true },
				{ name: '🛠 Discord.js', value: version, inline: true },
				{ name: '🏓 Ping', value: `${client.ws.ping}ms`, inline: true },
				{ name: '🤹🏻‍♀️ Commands', value: `${client.commands.size}`, inline: true },
				{ name: '🌍 Servers', value: `${client.guilds.cache.size}`, inline: true },
				{ name: '👨‍👩‍👧‍👦 Users', value: `${client.users.cache.size}`, inline: true },
				{ name: '💬 Text Channels', value: `${getChannelTypeSize([ChannelType.GuildText])}`, inline: true },
				{ name: '🎤 Voice Channels', value: `${getChannelTypeSize([ChannelType.GuildVoice, ChannelType.GuildStageVoice])}`, inline: true },
				{ name: '🧵 Threads', value: `${getChannelTypeSize([ChannelType.PublicThread, ChannelType.PrivateThread])}`, inline: true }
			)
			.setFooter({ text: 'Last Checked' })
			.setTimestamp();
		await interaction.editReply({ embeds: [embed] });
	}
});