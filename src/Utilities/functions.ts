// Map to store cooldowns for commands
export const cooldowns = new Map<string, Map<string, number>>(); // Key: command name, Sub-key: user ID, Value: cooldown end timestamp (ms)

// Function to check if a user is on cooldown for a specific command
function isNumber(value: number | boolean): value is number {
	return typeof value === 'number';
}
export function isOnCooldown(commandName: string, userId: string): boolean {
	const Cooldown = cooldowns.get(commandName)?.get(userId) ?? false;

	// Add a console log to verify the retrieved cooldown value
	// console.log(`Retrieved cooldown for ${commandName} and ${userId}: ${Cooldown}`);

	return isNumber(Cooldown) && Cooldown > Date.now();
}


// Function to set a cooldown for a user on a specific command
export function setCooldown(commandName: string, userId: string, Cooldown: number): void {
	// Get the existing command cooldowns or create a new Map if it doesn't exist
	const commandCooldowns = cooldowns.get(commandName) || new Map();
	commandCooldowns.set(userId, Date.now() + Cooldown);

	// Directly update the main cooldowns Map with the modified command cooldowns
	cooldowns.set(commandName, commandCooldowns);

	// console.log(`Setting cooldown for ${commandName} by ${Cooldown} milliseconds.`);
}