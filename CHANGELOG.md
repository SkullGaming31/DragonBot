# Changelog

All notable changes to this repository will be documented in this file.

## [Unreleased]

- Add repository Copilot instructions and a strict guidance note to avoid `any` in source code. (commit bba711c)
- CI: Run test job in `node:18-bullseye` container to ensure OpenSSL 1.1 is available for mongodb-memory-server (commit 187f04e)
- Marketplace feature: added marketplace commands (create/buy/list/remove), listing schema, tests, and CI test reporter (commit 98a7593)
- Documentation: updated TODO and referenced marketplace implementation (commit f1e958b)

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
