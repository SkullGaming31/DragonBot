## DragonBot — Copilot / AI assistant instructions

This file gives concise, actionable guidance for an AI coding assistant working on the DragonBot repository.
Keep guidance concrete and repository-specific. Avoid generic coding rules; prefer references to files and real examples.

High-level architecture
- This is a TypeScript Discord bot (discord.js v14) with an Express API. Main entry: `src/index.ts`.
- `ExtendedClient` (in `src/Structures/Client.ts`) boots the bot, registers commands and events, and calls `client.start()`.
- Commands: located in `src/Commands/*/*.{ts,js}`. Each command exports a `CommandType` (see `src/Typings/Command.ts`) with properties like `Category`, `Cooldown`, `run` and the standard ChatInputApplicationCommandData fields.
- Events: located in `src/Events/*/*.{ts,js}` and implement the `Event` structure in `src/Structures/Event.ts`.
- Database: Mongoose is used in `src/Database/*`. Tests use `mongodb-memory-server` and sometimes start a replica set to exercise transactions (`test/*` files). Look at `test/helpers/mongoMemory.ts` and `test/market.test.ts` for patterns.

Key conventions and quirks
- Environment variable key is `Enviroment` (note the spelling); many files branch on `process.env.Enviroment` with values `'dev' | 'prod' | 'debug'`. See `src/enviroment.d.ts` and usages in `src/Structures/Client.ts` and `src/Database/index.ts`.
- Commands must export a `name` and be set-like objects compatible with discord.js' Chat Input command structure. The runtime expects `client.commands` to be a `Collection<string, CommandType>`.
- Use `safeInteractionReply` in `src/Utilities/functions.ts` for replying to interactions — it encapsulates common reply/editReply/followUp fallbacks and handles Discord API errors. Prefer this helper instead of calling `interaction.reply` directly in new code.
- `cooldowns` Map (also in `src/Utilities/functions.ts`) is used for command cooldowns. Use `isOnCooldown` and `setCooldown` helpers.
- Database transactions: code tries to use mongoose transactions when available; if not, commands fall back to guarded update patterns (see `src/Commands/Fun/transfer.ts` and `src/Commands/Fun/market-buy.ts`). When adding features that mutate economy state, follow these patterns: try session-based transaction first, add guarded findOneAndUpdate fallback, and write tests that run against `MongoMemoryReplSet` to verify behaviour.

Developer workflows (how to build, run, and test)
- Install: `npm ci` or `npm install`.
- Dev run: `npm run dev` (uses `ts-node` to run `src/index.ts`).
- Build: `npm run build` -> `dist/` (entry `./dist/index.js`).
- Typecheck: `npm run typecheck` (tsc --noEmit).
- Lint: `npm run lint` (eslint --fix src) — the project uses a fairly strict `@typescript-eslint` setup; the repo historically moved many `any` -> `unknown` + narrows.
- Tests: `npm test` (vitest). Tests often use `mongodb-memory-server`. CI runs tests inside a container (`node:18-bullseye`) to ensure OpenSSL 1.1 is available for mongod binaries.

Testing patterns and CI notes
- Tests that exercise transactions use `MongoMemoryReplSet.create()` (see `test/market.test.ts`). Keep the replica set runs short and deterministic (use count:1 for speed) and close the replset after tests.
- Vitest is configured to output JUnit XML in CI. See `.github/workflows/ci.yml` for how the workflow runs tests and uploads `vitest-junit.xml` as an artifact.
- CI quirk: runners on newer Ubuntu may lack `libcrypto.so.1.1`. Use the `node:18-bullseye` container in workflow `test` job or ensure libssl1.1 is available. See the workflow for the expected solution.

- Code style and patterns to follow
- Prefer `unknown` over `any` and narrow at runtime. Many existing helpers and event handlers follow that pattern.
- Rule: Avoid `any` except as an absolute last resort. When you encounter code that currently uses `any`, prefer one of these:
  - Replace `any` with `unknown` and add runtime type guards / narrowers before use (see `src/Utilities/functions.ts` for examples of runtime checks).
  - Use a precise union, interface, or a small typed wrapper for the shape you expect.
  - If a third-party value is untyped, add a thin adapter function that validates and returns a typed value.

  Example (preferred):

  ```ts
  // avoid: const result: any = parseSomething(raw);
  const result: unknown = parseSomething(raw);
  if (typeof result === 'object' && result !== null && 'id' in result) {
    const typed = result as { id: string };
    // use typed.id safely
  }
  ```

  Exception policy:
  - Tests, quick one-off scripts, or prototype code may temporarily use `any` but please add a TODO comment referencing the file and a short plan to replace it with proper types.
  - If `any` is absolutely necessary (e.g., when dealing with a deeply dynamic external payload and adding types would be large), add a comment explaining why and prefer `unknown` at the call site instead.
- Interaction replies: use `safeInteractionReply` to avoid duplicate-reply errors. See `src/Utilities/functions.ts` for the fallback sequence.
- Command run signature: the `run` function receives `{ client, interaction, args }` where `interaction` is typed as `ExtendedInteraction` (see `src/Typings/Command.ts`). Use these types in new commands.
- Register commands: `ExtendedClient.registerModules()` collects commands and registers them either globally or to a dev guild depending on `Enviroment`. If adding registration changes, update that method.

Important files to reference when coding
- `src/Structures/Client.ts` — bot startup, command/event registration, `Enviroment` behavior.
- `src/Structures/Event.ts` — event structure and typing patterns.
- `src/Typings/Command.ts` — command type contract (inputs/outputs).
- `src/Utilities/functions.ts` — helpers: `safeInteractionReply`, cooldowns.
- `src/Database/index.ts` — mongoose connection and environment-sensitive config.
- Tests: `test/*` and `test/helpers/mongoMemory.ts` — examples of using mongodb-memory-server and replica sets.
- CI: `.github/workflows/ci.yml` — how tests are executed in CI and the OpenSSL compatibility workaround.

What to avoid changing without checking maintainers
- `Enviroment` spelling and runtime branching — changing environment variable names can silently break dev/prod login flows.
- Command registration behavior: switching between guild-global registration logic must be coordinated with bot tokens and dev guild IDs (see `.env.example`).

Example snippets (use these shapes when adding features)
- New command skeleton (place in `src/Commands/<Category>/myCommand.ts`):
  - Export an object matching `CommandType` with `name`, `description`, `Category`, optional `Cooldown` and a `run` method accepting `{ client, interaction, args }`.
- Database transaction pattern:
  - Try `const session = await mongoose.startSession(); await session.withTransaction(async () => { /* updates */ }); session.endSession();`
  - Fallback: guarded updates using `findOneAndUpdate(filterWithConditions, { $inc: {...} }, { session, new: true })` and manual rollback on failure.

If anything here seems incomplete or outdated, point to the file(s) you want me to re-read and I will iterate the instructions. Keep the requested updates small and specific (for example: "add examples for ticket templates" or "include event naming conventions").
