import { describe, it, expect, beforeEach } from 'vitest';
import { setCooldown, isOnCooldown, cooldowns } from '../src/Utilities/functions';

describe('Cooldown utilities', () => {
  beforeEach(() => {
    // Clear cooldowns map before each test
    cooldowns.clear();
  });

  it('setCooldown should add a cooldown and isOnCooldown should return true immediately', () => {
    setCooldown('testcmd', 'user1', 1000); // 1 second
    expect(isOnCooldown('testcmd', 'user1')).toBe(true);
  });

  it('isOnCooldown should return false after timeout expires', async () => {
    setCooldown('testcmd', 'user2', 50); // 50ms
    expect(isOnCooldown('testcmd', 'user2')).toBe(true);
    // wait 60ms
    await new Promise((r) => setTimeout(r, 60));
    expect(isOnCooldown('testcmd', 'user2')).toBe(false);
  });
});
