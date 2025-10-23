# Changelog

All notable changes to this repository will be documented in this file.

## [Unreleased]

- Add repository Copilot instructions and a strict guidance note to avoid `any` in source code. (commit bba711c)
- CI: Run test job in `node:18-bullseye` container to ensure OpenSSL 1.1 is available for mongodb-memory-server (commit 187f04e)
- Marketplace feature: added marketplace commands (create/buy/list/remove), listing schema, tests, and CI test reporter (commit 98a7593)
- Documentation: updated TODO and referenced marketplace implementation (commit f1e958b)

- Reaction roles manager: persistent mappings stored in DB, admin commands (create/list/delete), and event handlers refactored to apply/remove roles based on stored mappings. Added `src/Database/Schemas/reactionRole.ts`, updated `src/Commands/Moderator/reactionRoles.ts`, `src/Events/customMessage/reactionRolesAdd.ts`, and `src/Events/customMessage/reactionRolesRemove.ts`.
- Tests: Added unit tests for reaction role event handlers (`test/events/reactionRolesAdd.test.ts`, `test/events/reactionRolesRemove.test.ts`) and fixed test mocks to support `.lean()` chaining.
  
## 2025-10-23 — Reaction roles manager: implementation & hardening

- Implemented a persistent Reaction Roles Manager with the following pieces:
	- Database schema: `src/Database/Schemas/reactionRole.ts` (stores guildId, channelId, messageId, emoji, roleId, label).
	- Admin command: `/reaction` with subcommands `create`, `create_message`, `list`, `delete`, and `cleanup` implemented in `src/Commands/Moderator/reactionRoles.ts`.
	- Event handlers: `src/Events/customMessage/reactionRolesAdd.ts` and `src/Events/customMessage/reactionRolesRemove.ts` apply and remove roles based on stored mappings.
	- Cleanup job: periodic cleanup to remove stale mappings and a one-off `cleanup` subcommand to run status or cleanup for a guild.
	- Helpers and hardening:
		- `src/Utilities/retry.ts` (`tryReact`) — retry with exponential backoff when adding reactions; explicitly treats Discord Missing Permissions (code 50013) as a permanent failure.
		- `src/Utilities/reactionMapping.ts` (`createAndLogMapping`) — centralized mapping creation, best-effort message reaction, and asynchronous audit logging.
		- `src/Utilities/audit.ts` (`sendGuildLog`) — centralized audit embed sender used for logging mapping creations/deletions.
	- UX: added a `create_message` subcommand to post content and attach a reaction-role in a single command (ensures message_content and message_id are mutually exclusive at the UI level).
	- Tests & docs:
		- Added unit tests covering retry behavior, permission failures, create flows and cleanup (`test/utilities/tryReact.test.ts`, `test/commands/reaction.*`, and related event tests).
		- Documentation: updated `README.md` and added `docs/reactionRoles.md` and `docs/index.md` with usage examples and screenshots placeholders.

Files changed/added (high level):
- `src/Commands/Moderator/reactionRoles.ts` — command logic and guarded permission checks
- `src/Utilities/retry.ts` — `tryReact` helper
- `src/Utilities/reactionMapping.ts` — `createAndLogMapping` helper
- `src/Utilities/audit.ts` — centralized audit helper
- `src/Database/Schemas/reactionRole.ts` — new schema
- Tests: multiple files under `test/commands` and `test/utilities`

Notes:
- Permission pre-flight checks were implemented but made permissive in test environments (only fail early when permissions objects explicitly indicate missing rights) to avoid breaking unit tests that use simple mocks.
- Audit logging is best-effort and asynchronous so command responsiveness isn't blocked by logging failures.
- Dashboard scaffold: minimal Next.js dashboard scaffold added for issue #59 (OAuth + NextAuth template and `issues/59.md`).
- Express API hardening: protected `/api/v1` with API key support and added common security headers and rate limiting in `src/index.ts`.

- Buttons: moved inline button logic into dedicated handlers under `src/Buttons/` and added a generic button loader. Added handlers: `accept`, `sugges-accept`, `sugges-decline`, and `sampleConfirm`. `testbutton` command added to create test buttons.
- Accept button: made role toggle reliable by fetching the guild member before checking roles; added concise role-toggle logging to the configured logs channel.
- Suggestions: moved accept/decline logic into `src/Buttons/suggesAccept.ts` and `src/Buttons/suggesDecline.ts` with safer embed-field updates.
- Logging: hardened `guildMemberUpdate` to avoid throwing when partial member data is present and to prefer concise logs when prior role state is unavailable.

- Tests: added unit tests for button handlers (`test/buttons/sampleConfirm.test.ts`, `test/buttons/accept.test.ts`) that mock interactions and DB lookups to validate add/remove behavior.
- Lint: addressed `@typescript-eslint/no-explicit-any` issues in button and developer test files by using `TextChannel`/`APIEmbedField` instead of `any` casts.

---

_This changelog is maintained manually. For details, see the commit history._
2025-10-14 — Ticket & Interaction improvements, transcript saving, economy suppression, tests

- Refactored ticket interaction handling to async/await and hardened replies:
	- Files: `src/Events/Tickets/ticketResponse.ts`, `src/Utilities/functions.ts`, `src/Events/Interaction/interactionCreate.ts`
	- Added `safeInteractionReply` to avoid crashes from Discord API errors (Unknown Interaction / Already Acknowledged).
	- Replaced deprecated Mongoose callback usage with `await ... .exec()`.

- Implemented HTML transcript generation and upload on ticket close:
	- File: `src/Events/Tickets/ticketResponse.ts`
	- Paginates messages (100 per fetch), caps at 5000 messages, builds an HTML transcript and uploads it to configured transcripts channel.

- Prevented economy notifications from being posted inside ticket areas:
	- File: `src/Events/customMessage/economy.ts`
	- Now checks both ticket DB entries and the ticket setup category so channels inside the ticket category are treated as ticket channels; prefers configured econ channel or skips posting to avoid spam.

- Improved global interaction handler behavior:
	- File: `src/Events/Interaction/interactionCreate.ts`
	- Removed immediate "Unknown Button" replies so button interactions can be handled by specific listeners.

- Tests added:
	- File: `test/ticket.spec.ts` — unit test for the ticket close flow (mocks DB and Discord interaction objects).

Notes:
- Replaced a temporary ticket-template implementation per user request; templates were created earlier on a feature branch but removed.
- Recommended follow-ups: add tests for lock/unlock/claim flows, transcript file-size handling (compression/external storage), and replace deprecated ephemeral usage with MessageFlags.

2025-10-17 — Market consolidation, economy hardening, logging & health updates

- Marketplace consolidation: replaced several separate market commands with a single subcommand-based command `src/Commands/Fun/market.ts` supporting `create`, `list`, `remove`, and `buy` subcommands. Tests updated to exercise the consolidated command. (see `test/market.test.ts`)

- Database schema hardening: added normalization hooks to `src/Database/Schemas/userModel.ts` to coerce `balance` and `bank` to integers (Math.floor) to prevent floating-point artifacts from being persisted. This mitigates fractional-economy issues seen when some commands produced non-integer updates.

- Event logging & utilities: hardened many event handlers to use a centralized logger and safer channel fetching (e.g., `guildBanAdd`, `guildCreate`, starboard handlers). Added `src/Utilities/logger.ts` improvements and switched event handlers to catch DB read/fetch errors and log them instead of throwing.

- API & process improvements: added an Express health route `src/routes/health.ts` with caching and checks for Discord gateway and MongoDB connectivity; added graceful shutdown handlers in `src/index.ts` to close the bot and HTTP server on signals and to log unhandled rejections/uncaught exceptions.

- Test & compatibility work: updated `test/market.test.ts` to use the consolidated `market` command and adjusted option shapes; ensured the vitest suite passes locally (all tests green).

- Backwards-compat stubs: the legacy market module paths were wrapped with lightweight shims that delegate to the consolidated `market.ts` to avoid breaking imports while reducing command registrations.



Notes:
- The schema hooks prevent future float persistence but do not retroactively sanitize remote DB documents; consider running a migration to floor existing balances if needed.
- Follow-up tasks: remove legacy files entirely when ready and add explicit tests to ensure the command registration deduplication in `src/Structures/Client.ts` behaves as expected.

# Starboard & Message Highlights — Design Notes

This draft file tracks the Starboard MVP design and scope before implementation on `feature/starboard`.

Planned MVP:
- Mongoose schema: `src/Database/Schemas/starboardDB.ts` (guildId, channelId, emoji, threshold, ignoredChannels, posts[])
- Event handlers: `messageReactionAdd`, `messageReactionRemove` (create/update/remove mapping)
- Commands: `/starboard set-channel`, `/starboard set-threshold` (owner or manage guild)
- Tests: unit tests for threshold logic, integration tests with mock DB

Implementation notes:
- Use `guild.commands` registration for slash commands in dev environment.
- Keep updates idempotent and use upsert to store mapping.
