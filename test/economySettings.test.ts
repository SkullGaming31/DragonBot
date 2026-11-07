import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ exec: vi.fn() }));
vi.mock('../src/Database/Schemas/economySettings', () => ({
	default: { findOne: () => ({ lean: () => ({ exec: mocks.exec }) }) }
}));

import { economyCommandDisabled, economyCommands, economyDisabled } from '../src/Utilities/economyCommands';

describe('economy settings', () => {
	it('preserves existing behavior when no settings exist', async () => {
		mocks.exec.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
		expect(await economyCommandDisabled('guild', 'daily')).toBe(false);
		expect(await economyDisabled('guild')).toBe(false);
	});

	it('blocks all commands and passive rewards when disabled', async () => {
		mocks.exec.mockResolvedValue({ enabled: false, disabledCommands: [] });
		expect(await economyCommandDisabled('guild', 'daily')).toBe(true);
		expect(await economyDisabled('guild')).toBe(true);
	});

	it('blocks only individually disabled commands when enabled', async () => {
		mocks.exec.mockResolvedValue({ enabled: true, disabledCommands: ['daily'] });
		expect(await economyCommandDisabled('guild', 'daily')).toBe(true);
		expect(await economyCommandDisabled('guild', 'work')).toBe(false);
		expect(await economyDisabled('guild')).toBe(false);
		expect(economyCommands.has('begin')).toBe(true);
		expect(economyCommands.has('editpoints')).toBe(false);
	});
});
