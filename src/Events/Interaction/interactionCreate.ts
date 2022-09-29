import { CommandInteractionOptionResolver } from "discord.js";
import { ExtendedInteraction } from "../../../src/Typings/Command";
import { client } from '../../index';
import { Event } from "../../../src/Structures/Event";

export default new Event('interactionCreate', async (interaction) => {
  //chat input commands
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    console.log(command)
    if (!command) return interaction.reply({ content: 'You have used a non-existant command, please try another command', ephemeral: true });

    command.run({
      args: interaction.options as CommandInteractionOptionResolver,
      client,
      interaction: interaction as ExtendedInteraction
    });
  }
});