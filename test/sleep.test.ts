import { describe, it, expect } from 'vitest';
import { sleep } from '../src/Utilities/util';

describe('sleep', () => {
  it('waits approximately the given time', async () => {
    const start = Date.now();
    await sleep(50);
    const duration = Date.now() - start;
    expect(duration).toBeGreaterThanOrEqual(45);
  });
});
