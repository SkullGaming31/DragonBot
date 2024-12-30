import { ApplicationCommandOptionType, ApplicationCommandType } from 'discord.js';
import { Command } from '../../Structures/Command';
import { ExtendedClient } from '../../Structures/Client';

export default new Command({
    // ISSUE: Command is not outputting new command data ex. first ping outputs 3! alter the command in the code and change it to output 1! but still outputs 3!
    name: 'reload',
    description: 'Reloads command',
    UserPerms: ['ManageGuild'],
    BotPerms: ['ManageGuild'],
    defaultMemberPermissions: ['ManageGuild'],
    Category: 'Utilities',
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'command',
            description: 'the command to reload',
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    run: async ({ interaction }) => {
        const commandName = interaction.options.getString('command', true).toLowerCase();
        const command = (interaction.client as ExtendedClient).commands.get(commandName);

        if (!command) {
            await interaction.reply({ content: `There is no command with name \`${commandName}\`!`, ephemeral: true });
        }

        try {
            delete require.cache[require.resolve(`../../Commands/${command?.Category}/${commandName}.ts`)];
            const newCommand = require(`../../Commands/${command?.Category}/${commandName}.ts`);
            console.log('New Command: ', newCommand.default);
            (interaction.client as ExtendedClient).commands.set(commandName, newCommand.default);
            interaction.reply({ content: `Command \`${newCommand.default.name}\` was reloaded!`, ephemeral: true });
        } catch (error) {
            if (error instanceof Error) {
                await interaction.reply(`There was an error while reloading a command \`${command?.name}\``);
                console.error(error);
            }
        }
        // await interaction.reply({ content: `Command is currently under development`, ephemeral: true });
    }
});