import { defineConfig } from 'vitest/config';

// Coverage thresholds — adjust numbers as your target
export default defineConfig({
	test: {
		// Increase hook timeout to allow slow startup of in-memory MongoDB
		hookTimeout: 120000,
		setupFiles: ['./test/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov'],
			reportsDirectory: './coverage',
			thresholds: {
				branches: 20,
				functions: 20,
				lines: 20,
				statements: 20
			}
		},
	},
});
