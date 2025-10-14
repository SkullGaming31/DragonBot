/* eslint-disable no-unused-vars */
import { ClientEvents } from 'discord.js';

export class Event<Key extends keyof ClientEvents> {
	constructor(
		public event: Key,
		// Mark args with unused indication by using underscore in runtime implementations
		public run: (..._args: ClientEvents[Key]) => void
	) { }
}