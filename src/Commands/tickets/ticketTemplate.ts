import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, MessageFlags } from 'discord.js';
import TemplateModel from '../../Database/Schemas/ticketTemplateDB';
import { Command } from '../../Structures/Command';

export default new Command({
  name: 'ticket-template',
  description: 'Manage ticket templates',
  type: ApplicationCommandType.ChatInput,
  Category: 'Tickets',
  defaultMemberPermissions: ['ManageGuild'],
  options: [
    {
      name: 'create',
      description: 'Create a new ticket template',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        { name: 'name', description: 'Template name', type: ApplicationCommandOptionType.String, required: true },
        { name: 'title', description: 'Embed title', type: ApplicationCommandOptionType.String, required: false },
        { name: 'description', description: 'Embed description', type: ApplicationCommandOptionType.String, required: false },
        { name: 'type', description: 'Ticket type this template applies for (optional)', type: ApplicationCommandOptionType.String, required: false },
        { name: 'buttons', description: 'Comma-separated button definitions e.g. "Help,❓,Transfer,🔁"', type: ApplicationCommandOptionType.String, required: false },
        { name: 'default', description: 'Set as default template for the guild', type: ApplicationCommandOptionType.Boolean, required: false }
      ]
    },
    {
      name: 'list',
      description: 'List saved templates for this guild',
      type: ApplicationCommandOptionType.Subcommand
    },
    {
      name: 'apply',
      description: 'Apply a template to an existing ticket (by channel) or create using it',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        { name: 'name', description: 'Template name', type: ApplicationCommandOptionType.String, required: true },
        { name: 'channel', description: 'Channel to apply the template to (optional)', type: ApplicationCommandOptionType.Channel, required: false }
      ]
    }
  ],

  run: async ({ interaction }) => {
    if (!interaction.inCachedGuild()) return;
    const sub = interaction.options.getSubcommand(true);
    const guildId = interaction.guildId!;

    if (sub === 'create') {
      const name = interaction.options.getString('name', true);
      const title = interaction.options.getString('title') ?? '';
      const desc = interaction.options.getString('description') ?? '';
      const type = interaction.options.getString('type') ?? undefined;
      const buttonsRaw = interaction.options.getString('buttons') ?? undefined;
      const isDefault = interaction.options.getBoolean('default') ?? false;

      const buttons = buttonsRaw ? buttonsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

      if (isDefault) {
        // unset existing defaults
        await TemplateModel.updateMany({ GuildID: guildId, IsDefault: true }, { IsDefault: false }).exec();
      }

      await TemplateModel.create({ GuildID: guildId, Name: name, Title: title, Description: desc, Type: type, Buttons: buttons, IsDefault: isDefault });
      return interaction.reply({ content: `Template **${name}** created.`, flags: MessageFlags.Ephemeral });
    }

    if (sub === 'list') {
      const templates = await TemplateModel.find({ GuildID: guildId }).exec();
      if (!templates.length) return interaction.reply({ content: 'No templates for this guild.', flags: MessageFlags.Ephemeral });

      const embed = new EmbedBuilder().setTitle('Ticket Templates');
      templates.forEach(t => embed.addFields({ name: t.Name, value: (t.Description ?? '(no description)') + (t.IsDefault ? ' [default]' : '') }));
      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'apply') {
      const name = interaction.options.getString('name', true);
      const channel = interaction.options.getChannel('channel');
      const template = await TemplateModel.findOne({ GuildID: guildId, Name: name }).exec();
      if (!template) return interaction.reply({ content: `Template ${name} not found.`, flags: MessageFlags.Ephemeral });

      if (channel) {
        // apply to existing channel - set first message embed
        if (channel.isTextBased()) {
          const embed = new EmbedBuilder();
          if (template.Title) embed.setTitle(template.Title);
          if (template.Description) embed.setDescription(template.Description);

          let templateRow = null;
          if (template.Buttons && template.Buttons.length) {
            const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
            templateRow = new ActionRowBuilder<import('discord.js').ButtonBuilder>();
            const defs = template.Buttons;
            if (defs.length % 2 === 0 && defs.every(d => typeof d === 'string')) {
              for (let i = 0; i < defs.length; i += 2) {
                const label = defs[i];
                const emoji = defs[i + 1];
                if (!label) continue;
                const btn = new ButtonBuilder().setCustomId(`tpl_${label.replace(/\s+/g, '_').toLowerCase()}`).setLabel(label).setStyle(ButtonStyle.Primary);
                if (emoji) btn.setEmoji(emoji as any);
                templateRow.addComponents(btn);
              }
            } else {
              for (const entry of defs) {
                let label = entry as string;
                let emoji: string | undefined;
                if (entry.includes('|')) {
                  [label, emoji] = entry.split('|').map(s => s.trim());
                } else if (entry.includes(',')) {
                  [label, emoji] = entry.split(',').map(s => s.trim());
                }
                if (!label) continue;
                const btn = new ButtonBuilder().setCustomId(`tpl_${label.replace(/\s+/g, '_').toLowerCase()}`).setLabel(label).setStyle(ButtonStyle.Primary);
                if (emoji) btn.setEmoji(emoji as any);
                templateRow.addComponents(btn);
              }
            }
          }

          const components = templateRow ? [templateRow] : undefined;
          await channel.send({ embeds: [embed], components }).catch(() => null);
          return interaction.reply({ content: `Applied template ${name} to ${channel}.`, flags: MessageFlags.Ephemeral });
        }
        return interaction.reply({ content: 'Channel must be a text channel.', flags: MessageFlags.Ephemeral });
      }

      return interaction.reply({ content: 'To create a ticket using a template, press the support button or use the template name when creating.', flags: MessageFlags.Ephemeral });
    }

    return interaction.reply({ content: 'Unknown subcommand', flags: MessageFlags.Ephemeral });
  }
});
