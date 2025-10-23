// Minimal test environment setup to make CI runs deterministic
// Set environment variables used in code paths so functions that gate on them don't early-return
process.env.Enviroment = process.env.Enviroment || 'dev';
process.env.API_KEY = process.env.API_KEY || 'test-api-key';
process.env.DEV_DISCORD_BOT_TOKEN = process.env.DEV_DISCORD_BOT_TOKEN || 'fake-token';
process.env.DEV_DISCORD_GUILD_ID = process.env.DEV_DISCORD_GUILD_ID || 'GUILD_TEST';
process.env.MONGO_DEV_URI = process.env.MONGO_DEV_URI || '';
process.env.MONGO_DATABASE_URI = process.env.MONGO_DATABASE_URI || '';

// Prevent any accidental real network calls in tests by mocking global fetch/axios if not already mocked in tests
try {
  // vitest provides globalThis.fetch sometimes; ensure a noop if absent
  if (typeof (globalThis as any).fetch === 'undefined') {
    (globalThis as any).fetch = async () => ({ ok: true, json: async () => ({}) });
  }
} catch (e) {
  // ignore
}

// Silence console during tests to keep logs clean (optional)
const originalConsole = console;
if (!process.env.DEBUG_TESTS) {
  console.log = (): void => { };
  console.info = (): void => { };
  console.warn = (): void => { };
  console.error = (): void => { };
}

export { };
