import { ChatInputApplicationCommandData, ChatInputCommandInteraction, CommandInteractionOptionResolver, GuildChannel, GuildMember, PermissionResolvable } from "discord.js";
import { ExtendedClient } from "src/Structures/Client";

/**
 * {
 * name: '',
 * description: '',
 * run: ({ interaction }) => {}
 * }
 */

export interface ExtendedInteraction extends ChatInputCommandInteraction {
  member: GuildMember
}

interface RunOptions {
  client: ExtendedClient,
  interaction: ExtendedInteraction,
  args: CommandInteractionOptionResolver
}

type RunFunction = (options: RunOptions) => any;

export type CommandType = {
  UserPerms: PermissionResolvable[];
  BotPerms: PermissionResolvable[];
  run: RunFunction;
} & ChatInputApplicationCommandData