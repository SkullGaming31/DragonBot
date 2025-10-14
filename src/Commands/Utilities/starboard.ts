import { ApplicationCommandOptionType, ApplicationCommandType, channelMention, TextChannel } from 'discord.js';
import StarboardModel from '../../Database/Schemas/starboardDB';
import { Command } from '../../Structures/Command';

export default new Command({
  name: 'starboard',
  description: 'Configure the starboard for this guild',
  type: ApplicationCommandType.ChatInput,
  Category: 'Utilities',
  defaultMemberPermissions: ['ManageGuild'],
  options: [
    {
      name: 'set-channel',
      description: 'Set the channel where starboard posts are sent',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        { name: 'channel', description: 'The channel to post starboard messages to', type: ApplicationCommandOptionType.Channel, required: true }
      ]
    },
    {
      name: 'set-threshold',
      description: 'Set how many reactions are required to post to starboard',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        { name: 'count', description: 'Number of reactions required', type: ApplicationCommandOptionType.Integer, required: true }
      ]
    },
    {
      name: 'set-emoji',
      description: 'Set which emoji triggers starboard (unicode or custom name/id)',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        { name: 'emoji', description: 'Emoji (unicode or custom)', type: ApplicationCommandOptionType.String, required: true }
      ]
    },
    {
      name: 'ignore-channel',
      description: 'Toggle ignoring a channel for starboard',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        { name: 'channel', description: 'Channel to ignore/unignore', type: ApplicationCommandOptionType.Channel, required: true }
      ]
    }
  ],

  run: async ({ interaction }) => {
    const sub = interaction.options.getSubcommand(true);
    const guildId = interaction.guildId;
    if (!guildId) return interaction.reply({ content: 'This command can only be used in a guild.', ephemeral: true });

    let config = await StarboardModel.findOne({ guildId }).exec();
    if (!config) {
      config = new StarboardModel({ guildId });
    }

    if (sub === 'set-channel') {
      const ch = interaction.options.getChannel('channel', true) as TextChannel;
      config.channelId = ch.id;
      await config.save();
      return interaction.reply({ content: `Starboard channel set to ${channelMention(ch.id)}`, ephemeral: false });
    }

    if (sub === 'set-threshold') {
      const count = interaction.options.getInteger('count', true);
      config.threshold = Math.max(1, count);
      await config.save();
      return interaction.reply({ content: `Starboard threshold set to ${config.threshold}`, ephemeral: false });
    }

    if (sub === 'set-emoji') {
      const emoji = interaction.options.getString('emoji', true);
      config.emoji = emoji;
      await config.save();
      return interaction.reply({ content: `Starboard emoji set to ${emoji}`, ephemeral: false });
    }

    if (sub === 'ignore-channel') {
      const ch = interaction.options.getChannel('channel', true);
      const chId = ch.id;
      const idx = config.ignoredChannels.indexOf(chId);
      if (idx >= 0) {
        config.ignoredChannels.splice(idx, 1);
        await config.save();
        return interaction.reply({ content: `Channel ${channelMention(chId)} is no longer ignored.`, ephemeral: false });
      } else {
        config.ignoredChannels.push(chId);
        await config.save();
        return interaction.reply({ content: `Channel ${channelMention(chId)} is now ignored.`, ephemeral: false });
      }
    }

    return interaction.reply({ content: 'Unknown subcommand', ephemeral: true });
  }
});
