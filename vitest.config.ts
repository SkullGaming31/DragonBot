import { defineConfig } from 'vitest/config';

// Coverage thresholds — adjust numbers as your target
export default defineConfig({
  test: {
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
});
