import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/Utilities/logger', () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }));
vi.mock('axios', () => ({ default: { post: vi.fn() } }));

import { escalateByWarnings, isAutomodTestExempt, tryBan, tryKick, tryTimeout } from '../../src/Utilities/moderation';

function member(overrides: Record<string, unknown> = {}) {
	return {
		id: 'member',
		guild: { id: 'guild', ownerId: 'owner' },
		moderatable: true,
		kickable: true,
		bannable: true,
		timeout: vi.fn().mockResolvedValue(undefined),
		kick: vi.fn().mockResolvedValue(undefined),
		ban: vi.fn().mockResolvedValue(undefined),
		...overrides,
	};
}

describe('moderation safety and escalation', () => {
	afterEach(() => vi.unstubAllEnvs());

	it.each([
		{ count: 1, action: 'timeout' },
		{ count: 2, action: 'kick' },
		{ count: 3, action: 'ban' },
	])('applies the action for $count warnings', async ({ count, action }) => {
		vi.stubEnv('AUTOMOD_DASHBOARD_URL', '');
		vi.stubEnv('AUTOMOD_TEST_USER_IDS', '');
		const m = member();
		expect(await escalateByWarnings(m as never, m.guild as never, count, 'reason')).toBe(action);
		if (action === 'timeout') expect(m.timeout).toHaveBeenCalledWith(300000, 'reason');
		if (action === 'kick') expect(m.kick).toHaveBeenCalledWith('reason');
		if (action === 'ban') expect(m.ban).toHaveBeenCalledWith({ reason: 'reason', deleteMessageSeconds: 5 });
		expect(m.timeout.mock.calls.length + m.kick.mock.calls.length + m.ban.mock.calls.length).toBe(1);
	});

	it('interprets a pre-update count as one additional warning', async () => {
		vi.stubEnv('AUTOMOD_DASHBOARD_URL', '');
		vi.stubEnv('AUTOMOD_TEST_USER_IDS', '');
		const m = member();
		expect(await escalateByWarnings(m as never, m.guild as never, 1, 'reason', true)).toBe('kick');
		expect(m.kick).toHaveBeenCalledOnce();
	});

	it('never escalates against the owner or a member without permission', async () => {
		const owner = member({ id: 'owner' });
		const unmanageable = member({ moderatable: false, kickable: false, bannable: false });
		expect(await escalateByWarnings(owner as never, owner.guild as never, 3)).toBeNull();
		for (const count of [1, 2, 3]) expect(await escalateByWarnings(unmanageable as never, unmanageable.guild as never, count)).toBeNull();
		expect(owner.ban).not.toHaveBeenCalled();
		expect(unmanageable.timeout).not.toHaveBeenCalled();
		expect(unmanageable.kick).not.toHaveBeenCalled();
		expect(unmanageable.ban).not.toHaveBeenCalled();
	});

	it('respects configured test-user exemptions', async () => {
		vi.stubEnv('ENVIRONMENT', 'dev');
		vi.stubEnv('AUTOMOD_TEST_USER_IDS', 'other, member');
		const m = member();
		expect(await escalateByWarnings(m as never, m.guild as never, 3)).toBeNull();
		expect(m.ban).not.toHaveBeenCalled();
	});

	it('does not apply configured exemptions in production', async () => {
		vi.stubEnv('ENVIRONMENT', 'prod');
		vi.stubEnv('AUTOMOD_TEST_USER_IDS', 'member');
		vi.stubEnv('AUTOMOD_DASHBOARD_URL', '');
		const m = member();
		expect(await escalateByWarnings(m as never, m.guild as never, 3)).toBe('ban');
		expect(m.ban).toHaveBeenCalledOnce();
		expect(isAutomodTestExempt('member')).toBe(false);
	});

	it('guards direct moderation helpers against owners and missing permissions', async () => {
		const owner = member({ id: 'owner' });
		const denied = member({ moderatable: false, kickable: false, bannable: false });
		for (const m of [owner, denied]) {
			expect(await tryKick(m as never)).toBe(false);
			expect(await tryBan(m as never)).toBe(false);
			expect(await tryTimeout(m as never, 1000)).toBe(false);
			expect(m.kick).not.toHaveBeenCalled();
			expect(m.ban).not.toHaveBeenCalled();
			expect(m.timeout).not.toHaveBeenCalled();
		}
	});
});
