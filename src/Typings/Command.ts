import { ChatInputApplicationCommandData, ChatInputCommandInteraction, CommandInteractionOptionResolver, GuildMember, PermissionResolvable } from 'discord.js';
import { ExtendedClient } from '../Structures/Client';

/**
 * {
 * name: '',
 * description: '',
 * run: ({ interaction }) => {}
 * }
 */

export interface ExtendedInteraction extends ChatInputCommandInteraction {
	member: GuildMember;
}

interface RunOptions {
	client: ExtendedClient,
	interaction: ExtendedInteraction,
	args: CommandInteractionOptionResolver
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RunFunction = (options: RunOptions) => any

export type CommandType = {
	UserPerms?: PermissionResolvable[];
	BotPerms?: PermissionResolvable[];
	Development?: boolean;
	run: RunFunction;
} & ChatInputApplicationCommandData