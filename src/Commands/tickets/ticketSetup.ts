import { ActionRowBuilder, ApplicationCommandOptionType, ApplicationCommandType, ButtonBuilder, ButtonStyle, ChannelType, Colors, EmbedBuilder } from "discord.js";
import { Command } from "../../../src/Structures/Command";
import ticket from '../../../src/Structures/Schemas/ticketSetupDB';

export default new Command({
  name: 'ticketsetup',
  description: 'Creates the initial ticket Embed',
  UserPerms: ['ManageMessages'],
  BotPerms: ['ManageMessages'],
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'channel',
      description: 'Select the Ticket creation channel',
      type: ApplicationCommandOptionType.Channel,
      required: true,
      channelTypes: [ChannelType.GuildText],
    },
    {
      name: 'category',
      description: 'Select the channel category where tickets will be created',
      type: ApplicationCommandOptionType.Channel,
      required: true,
      channelTypes: [ChannelType.GuildCategory],
    },
    {
      name: 'transcripts',
      description: 'Select the transcripts channel.',
      type: ApplicationCommandOptionType.Channel,
      required: true,
      channelTypes: [ChannelType.GuildText],
    },
    {
      name: 'handlers',
      description: 'Select the role that will handle tickets',
      type: ApplicationCommandOptionType.Role,
      required: true,
    },
    {
      name: 'everyone',
      description: 'Provide the @everyone Role, Its Important',
      type: ApplicationCommandOptionType.Role,
      required: true,
    },
    {
      name: 'botrole',
      description: 'Provide your bots role',
      type: ApplicationCommandOptionType.Role,
      required: true,
    },
    {
      name: 'description',
      description: 'Set the description of the ticket embed',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: 'firstbutton',
      description: 'give your first button a name followed by a comma then the emoji',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: 'secondbutton',
      description: 'give your second button a name followed by a comma then the emoji',
      type: ApplicationCommandOptionType.String,
      required: false,
    },
    {
      name: 'thirdbutton',
      description: 'give your third button a name followed by a comma then the emoji',
      type: ApplicationCommandOptionType.String,
      required: false,
    }
  ],
  run: async ({ interaction }) => {
    const { guild, options } = interaction;

    try {
      const Channel = options.getChannel('channel');
      const Category = options.getChannel('category');
      const Transcripts = options.getChannel('transcripts');

      const Handlers = options.getRole('handlers');
      const Everyone = options.getRole('everyone');
      const BotRole = options.getRole('botrole');

      const Description = options.getString('description');


      const FirstButton = options.getString('firstbutton');
      const SecondButton = options.getString('secondbutton');
      const ThirdButton = options.getString('thirdbutton');

      if (FirstButton === null || SecondButton === null || ThirdButton === null) return;

      await ticket.findOneAndUpdate(
        { GuildID: guild?.id },
        {
          Channel: Channel?.id,
          Category: Category?.id,
          Transcripts: Transcripts?.id,
          Handlers: Handlers?.id,
          Everyone: Everyone?.id,
          BotRole: BotRole?.id,
          Description: Description,
          Buttons: [FirstButton, SecondButton, ThirdButton],
        },
        {
          new: true,
          upsert: true,
        }
      );

      const Buttons = new ActionRowBuilder<ButtonBuilder>();
      Buttons.addComponents(
        new ButtonBuilder()
          .setCustomId(FirstButton)
          .setLabel(FirstButton)
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(SecondButton)
          .setLabel(SecondButton)
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(ThirdButton)
          .setLabel(ThirdButton)
          .setStyle(ButtonStyle.Secondary)
      );
      const embed = new EmbedBuilder()
        .setColor(Colors.DarkPurple)
        .setAuthor({ name: `${guild?.name} | Ticket System`, iconURL: guild?.iconURL({ size: 512 }) ?? undefined })
        .setDescription(Description);

      let ticketChannel;
      if (Channel?.id !== undefined) ticketChannel = guild?.channels.cache.get(Channel?.id);
      if (ticketChannel?.type === ChannelType.GuildText) ticketChannel.send({ embeds: [embed], components: [Buttons] });

      interaction.reply({ content: 'done', ephemeral: true });
    } catch (error) {
      const errEmbed = new EmbedBuilder().setColor(Colors.Red)
        .setDescription(`⛔ | An Error occured while setting up your ticket system\n **What to make sure of?**
			1. Make sure none of your buttons names are duplacated.
			2. Make sure to use this format for your buttons => Name,Emoji.
			3. Make sure your button names do not exceed 200 characters.
			4. Make sure your button emojis are actually emojis, not ids.`);
      console.error(error);
      interaction.reply({ embeds: [errEmbed], ephemeral: true });
    }
  }
});