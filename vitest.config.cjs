// CommonJS Vitest config for CI environments
// Exports a plain object to avoid ESM require issues seen on some runners
module.exports = {
  test: {
    // keep setup equivalent to the TS config
    setupFiles: ['./test/setup.ts'],
    // reduce parallelism to be gentle on CI runners / memory
    threads: false,
    // coverage settings
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
};
