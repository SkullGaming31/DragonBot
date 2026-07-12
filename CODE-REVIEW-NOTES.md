# DragonBot — Priority List

Consolidated from code reviews (July 12, 2026). Use this as a working backlog for fixes and improvements.

**Status key:** `[ ]` open · `[~]` in progress · `[x]` done

---

## High -DONE

Live bugs or reliability issues that can affect users or process stability today.

- [x] **Fix Twitch Subscriber role check in** `gamble.ts`  
  `member?.roles.cache.has('Twitch Subscriber')` looks up by role **ID**, not name — the 25% sub bonus is almost certainly never applied (all users get 20%). Appears at lines 61, 92, and 115.  
  *Fix:* Use a role ID from settings/env (like `bal.ts` / `leaderboard.ts`), or match the working pattern in `economy.ts`: `.some(role => role.name === 'Twitch Subscriber')`.

- [X] **Make** `gamble.ts` **balance updates atomic**  
  Balance is read with `findOne`, validated, then updated with `$inc` in separate steps. Concurrent bets can overdraw or produce inconsistent balances.  
  *Fix:* Single `findOneAndUpdate` with `balance: { $gte: betAmount }` in the query filter (same pattern as `market.ts` / `transfer.ts`).

- [X] **Remove or wire up dead** `errorHandler.ts`  
  `src/Structures/errorHandler.ts` registers `unhandledRejection`, `uncaughtException`, `SIGINT`, and `SIGTERM` handlers but is never imported. `index.ts` already registers its own versions.  
  *Fix:* Delete the file, or import it once and remove the duplicate handlers from `index.ts`.

- [X] **Fix MongoDB** `connection.on('error')` **throwing**  
  `src/Database/index.ts` throws inside the connection `error` event handler, which can crash the process instead of logging and recovering.

---



## Med -INPROGRESS

Important improvements for security, observability, and correctness — not always user-visible immediately, but worth addressing soon.

- [X] **Audit economy commands for balance race conditions**  
  Extend atomic `$gte` balance checks beyond `gamble.ts` to: `heist.ts`, `beg.ts`, `work.ts`, `loot.ts`, `dig.ts`.  
  `market.ts`, `transfer.ts`, `withdraw.ts`, and `deposit.ts` already use safer patterns.

- [X] **Decouple** `webhookHandler` **from** `index.ts`  
  `src/Integrations/webhookHandler.ts` imports `appInstance` from `index.ts`, pulling in the full Express app and Discord client. Causes circular coupling and slow/flaky test imports.

- [X] **Remove API key from query string**  
  `src/index.ts` accepts `req.query.api_key`. Query-string secrets leak via access logs, browser history, and referrers. Require `x-api-key` header only.

- [X] **Guard** `Client.start()` **for unknown** `Enviroment` **values**  
  `src/Structures/Client.ts` only calls `login()` for `dev`, `debug`, and `prod`. Any other value silently skips login with no error.

- [X] **Route command errors through shared logger**  
  ~31 of 44 command files use `console.log` / `console.error` directly. None import `Utilities/logger.ts`, so most command errors are not persisted to file or Mongo.

- [X] **Review** `allowedMentions` **config**  
  `src/Structures/Client.ts` parses `everyone`, `roles`, and `users`. User-controlled reply content could trigger mass pings unless every send path sanitizes mentions.

---



## Low

Polish, maintainability, and minor hardening — do when higher-priority work is done.

- [X] **Re-enable** `@typescript-eslint/no-unused-vars` **as** `warn`  
  Both `no-unused-vars` and `@typescript-eslint/no-unused-vars` are `'off'` in `eslint.config.mjs`. Suggested: `['warn', { argsIgnorePattern: '^_' }]`.

- [x] **Add braces to multi-statement switch cases in** `gamble.ts`  
  The `'fixed number'` case declared `const` directly in the switch without a block; wrapped the case in braces to avoid declaration-in-case issues.

- [X] **Call** `mongoose.disconnect()` **on graceful shutdown**  
  `src/index.ts` shuts down the Discord client and HTTP server but does not close the Mongo connection.

- [X] **Move** `supertest` **to** `devDependencies`  
  Listed as a production dependency in `package.json` but only used in tests.

- [ ] **Fix or replace** `checkVariables()`  
  `src/Structures/checkVariables.ts` iterates `Object.entries(env)` and checks `value === undefined`, but undefined values never appear in entries — it won't catch missing required vars.

- [ ] **Correct misleading comment in** `autoModeration.ts`  
  Line ~122 says escalation treats count as "before-update by default," but `escalateByWarnings` defaults `isBeforeUpdate` to `false`. Behavior works today; comment is wrong and risky for future edits.

- [ ] **Remove** `__test_`* **exports from production** `autoModeration.ts`  
  Test-only helpers (`__test_invokeInvite`, etc.) are exported from the runtime event module.
- [ ] fix **Warning: Supplying "ephemeral" for interaction response options is deprecated. Utilize flags instead.
  (Use `node --trace-warnings ...` to show where the warning was created)**

---



## Backlog

Future or lower-urgency items — track here, tackle when bandwidth allows.

- [ ] **Replace in-memory automod spam tracker with shared storage**  
  `messageHistory` in `autoModeration.ts` resets on restart and does not work across multiple bot instances. Only matters at scale or with horizontal scaling.

- [ ] **Standardize** `Enviroment` **→** `Environment` **spelling**  
  Typo is used consistently across the codebase (`enviroment.d.ts`, `Client.ts`, `index.ts`, etc.). Low risk to change but touches many files.

- [ ] **Upgrade** `glob` **from v7**  
  `glob@7.2.3` is used in `Client.ts` module loading. Consider migrating to a maintained major version.

- [ ] **Remove redundant** `os` **npm package**  
  Node provides `os` built-in; the `os@0.1.2` dependency in `package.json` appears unnecessary.

- [ ] **Configure Twitch Subscriber role via settings DB**  
  Longer-term: store subscriber role ID in `SettingsModel` (alongside `AdministratorRole` / `ModeratorRole`) instead of hardcoding name or env var in multiple files (`gamble.ts`, `economy.ts`).

- [ ] **Fix README table of contents markup**  
  `README.md` has a broken `<li>` nesting in the Table of Contents section.

---



## Suggested order of attack

1. High — `gamble.ts` role check + atomic balance (quick wins, live user impact)
2. High — `errorHandler.ts` cleanup + Mongo error handler
3. Med — economy race audit, logger sweep, API key / env guards
4. Low — ESLint, shutdown, dependency tidy-up
5. Backlog — scale and refactor items as needed

