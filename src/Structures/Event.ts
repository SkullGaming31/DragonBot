/* eslint-disable no-unused-vars */
import { ClientEvents } from 'discord.js';

export class Event<Key extends keyof ClientEvents> {
	constructor(
		public event: Key,
		public run: (...args: ClientEvents[Key]) => void
	) { }
}