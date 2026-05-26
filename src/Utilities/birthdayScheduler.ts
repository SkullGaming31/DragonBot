import { Client, TextChannel } from 'discord.js';
import BirthdayModel from '../Database/Schemas/birthdayDB';
import BirthdaySettingsModel from '../Database/Schemas/birthdaySettingsDB';

export async function sendBirthdayGreeting(client: Client, guildId: string, userId: string, channelId?: string, birthYear?: number | null) {
	try {
		const guild = client.guilds.cache.get(guildId) ?? await client.guilds.fetch(guildId).catch(() => undefined);
		if (!guild) return;
		const member = await guild.members.fetch(userId).catch(() => undefined);
		const channel = channelId ? (guild.channels.cache.get(channelId) as TextChannel | undefined) : undefined;
		let sendChannel = channel;
		if (!sendChannel) {
			// fallback to system channel or first text channel
			const sys = guild.systemChannel as TextChannel | undefined;
			if (sys) sendChannel = sys;
			else {
				const first = guild.channels.cache.find((c) => c.isTextBased() && c.type === 0) as TextChannel | undefined;
				if (first) sendChannel = first;
			}
		}
		if (!sendChannel) return;

		const display = member ? `${member.user}` : `<@${userId}>`;
		let message = `🎉 Happy Birthday ${display}! 🎂`;
		if (typeof birthYear === 'number' && Number.isFinite(birthYear)) {
			const nowYear = new Date().getUTCFullYear();
			const age = nowYear - birthYear;
			if (age >= 0) message = `🎉 Happy Birthday ${display}! You are ${age} today 🎂`;
		}
		await sendChannel.send(message);
	} catch (err) {
		// swallow errors to avoid crashing scheduler
		// console.error('sendBirthdayGreeting error', err);
	}
}

export async function runBirthdayCheck(client: Client) {
	try {
		const now = new Date();
		const month = now.getUTCMonth() + 1; // 1-12
		const day = now.getUTCDate();

		const todays = await BirthdayModel.find({ month, day }).lean();
		if (!todays || todays.length === 0) return { sent: 0 };

		let sent = 0;
		for (const b of todays) {
			try {
				const settings = await BirthdaySettingsModel.findOne({ GuildID: b.guildID }).lean();
				const channelId = settings?.ChannelID ?? undefined;
				await sendBirthdayGreeting(client, b.guildID, b.userID, channelId, (b).year ?? null);
				sent++;
			} catch {
				// continue
			}
		}
		return { sent };
	} catch (err) {
		return { sent: 0 };
	}
}

export function startBirthdayScheduler(client: Client) {
	// Check hourly and run immediately
	runBirthdayCheck(client).catch(() => null);
	const id = setInterval(() => runBirthdayCheck(client).catch(() => null), 60 * 60 * 1000);
	return () => clearInterval(id);
}

export default { runBirthdayCheck, startBirthdayScheduler };
