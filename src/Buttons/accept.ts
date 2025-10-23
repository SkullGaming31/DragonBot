import { ButtonType } from '../Typings/Button';
import { ButtonStyle, MessageFlags, RoleResolvable } from 'discord.js';

import SettingsModel from '../Database/Schemas/settingsDB';
import ChanLogger from '../Database/Schemas/LogsChannelDB';
import { EmbedBuilder, ChannelType } from 'discord.js';
import { info as logInfo } from '../Utilities/logger';

const acceptButton: ButtonType = {
  customId: 'accept',
  defaultLabel: 'Accept',
  defaultStyle: ButtonStyle.Primary,
  run: async ({ interaction }) => {
    // Check if the interaction is in the "rules" channel
    const { user, guild } = interaction;
    const settings = await SettingsModel.findOne({ GuildID: guild?.id });
    const rulesChannelId = settings?.rulesChannel;
    if (interaction.channelId !== rulesChannelId) return;

    const roleId: RoleResolvable | undefined = settings?.MemberRole;

    if (!roleId) {
      const owner = await interaction.guild?.fetchOwner({ cache: true });
      if (user.id !== owner?.id) {
        await interaction.reply({ content: 'Role ID not found in settings. Please contact an ``Admin`` to assign the role.', flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ content: 'Role ID not found in settings. Please use the ``/settings`` command to set it', flags: MessageFlags.Ephemeral });
      }
      return;
    }

    try {
      // Ensure we have an up-to-date GuildMember object (fetch if not cached)
      const member = (await (interaction.guild?.members.fetch(user.id).catch(() => null))) ?? null;
      if (!member) {
        await interaction.reply({ content: 'Member not found.', flags: MessageFlags.Ephemeral });
        return;
      }

      const role = interaction.guild?.roles.cache.get(roleId);
      if (!role) {
        await interaction.reply({ content: 'Role not found in the server.', flags: MessageFlags.Ephemeral });
        return;
      }

      const username = member.user?.globalName ?? member.user?.username ?? member.id;
      let action = '';
      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(role);
        action = 'removed';
        await interaction.reply({ content: 'Role removed successfully!', flags: MessageFlags.Ephemeral });
      } else {
        await member.roles.add(role);
        action = 'added';
        await interaction.reply({ content: 'Role assigned successfully!', flags: MessageFlags.Ephemeral });
      }

      // Try to send a concise log about this single role change to the configured logs channel
      try {
        const logCfg = await ChanLogger.findOne({ Guild: guild?.id });
        const logsChannelID = logCfg?.Channel;
        if (logsChannelID) {
          let logsChannel = guild?.channels.cache.get(logsChannelID as string) as any;
          if (!logsChannel) logsChannel = await guild?.channels.fetch(logsChannelID as string).catch(() => undefined);
          if (logsChannel && logsChannel.type === ChannelType.GuildText) {
            const embed = new EmbedBuilder()
              .setTitle(`${guild?.name} | Member Update`)
              .setDescription(`\`${username}\` has ${action} the role \`${role?.name}\``)
              .setColor(action === 'added' ? 'Green' : 'Red')
              .setTimestamp();
            await logsChannel.send({ embeds: [embed] });
            logInfo('accept button: logged role toggle', { guild: guild?.id, member: member.id, role: roleId, action });
          }
        }
      } catch (err) {
        console.error('Failed to log role toggle from accept button:', err);
      }
    } catch (error) {
      console.error('Error toggling role:', error);
      await interaction.reply({ content: 'An error occurred while toggling the role.', flags: MessageFlags.Ephemeral });
    }
  }
};

export default acceptButton;