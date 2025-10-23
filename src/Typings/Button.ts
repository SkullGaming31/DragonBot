import type { ButtonInteraction, ButtonStyle } from 'discord.js';
import type { ExtendedClient } from '../Structures/Client';

export type ButtonRunOptions = {
  client: ExtendedClient;
  interaction: ButtonInteraction;
};

export type ButtonType = {
  customId: string;
  // Optional defaults for command-created buttons
  defaultLabel?: string;
  defaultStyle?: ButtonStyle;
  run: (options: ButtonRunOptions) => unknown | Promise<unknown>;
};

export default ButtonType;
