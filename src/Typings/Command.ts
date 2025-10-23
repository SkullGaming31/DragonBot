import { ChatInputApplicationCommandData, ChatInputCommandInteraction, CommandInteractionOptionResolver, GuildMember, PermissionResolvable } from 'discord.js';
import { ExtendedClient } from '../Structures/Client';

export interface ExtendedInteraction extends ChatInputCommandInteraction {
	member: GuildMember;
}

interface RunOptions {
	client: ExtendedClient;
	interaction: ExtendedInteraction;
	args: CommandInteractionOptionResolver;
}

type RunFunction = (options: RunOptions) => unknown;

export type CommandType = {
	UserPerms?: PermissionResolvable[];
	BotPerms?: PermissionResolvable[];
	defaultMemberPermissions?: PermissionResolvable[];
	Development?: boolean;
	Cooldown?: number;
	Category: string;
	run: RunFunction;
} & ChatInputApplicationCommandData