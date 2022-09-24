import { CommandInteractionOptionResolver } from "discord.js";
import { ExtendedInteraction } from "src/Typings/Command";
import { client } from "../..";
import { Event } from "../../Structures/Event";

export default new Event('interactionCreate', async (interaction) => {
  //chat input commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return interaction.reply({ content: 'You have used a non-existant command, please try another command', ephemeral: true });

    command.run({
      args: interaction.options as CommandInteractionOptionResolver,
      client,
      interaction: interaction as ExtendedInteraction
    });
  }
});