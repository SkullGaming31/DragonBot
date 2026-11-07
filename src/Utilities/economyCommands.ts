import EconomySettings from '../Database/Schemas/economySettings';

// Keep this list in sync with the dashboard's economy API.
export const economyCommands = new Set([
	'begin', 'bal', 'beg', 'daily', 'deposit', 'dig', 'gamble',
	'heist', 'leaderboard', 'loot', 'market', 'roulette', 'transfer', 'withdraw', 'work'
]);

export async function economyCommandDisabled(guildId: string, command: string): Promise<boolean> {
	const settings = await EconomySettings.findOne({ guildId }).lean().exec();
	return settings?.enabled === false || (settings?.disabledCommands?.includes(command) ?? false);
}

export async function economyDisabled(guildId: string): Promise<boolean> {
	const settings = await EconomySettings.findOne({ guildId }).lean().exec();
	return settings?.enabled === false;
}
