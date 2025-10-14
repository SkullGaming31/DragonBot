# DragonBot - Proposed New Features

Below are suggested features and improvements you can add to DragonBot. Each item includes a short description and why it helps.

1. Auto-moderation & anti-spam
   - Add configurable auto-moderation rules (bad-words, invite/links, caps, spam detection) with actions (warn, mute, kick, ban) and an allowlist/ignore list per guild.

2. Reaction roles manager
   - Implement a reaction-roles UI command to create/manage role reactions, support multi-role messages, and persistent storage in DB.

3. Ticketing improvements (transcripts + templates) IN PROGRESS
   - Add ticket templates, automatic transcript generation and saving to DB or file storage, and ticket assignment/CLAIM features for support staff.

4. Guild dashboard (Vue) with OAuth
   - Finish the Vue 3 dashboard with OAuth login, guild selection, command and settings pages to let admins configure the bot visually.

5. Custom per-guild commands
   - Allow server admins to create simple custom text/response commands, including variable interpolation (user, args), and permissions control.

6. XP / Leveling & leaderboards
   - Add opt-in leveling system with XP gains for activity, per-guild config, role rewards, and leaderboard endpoints for dashboard display.

7. Scheduled reminders & events
   - Add a scheduler for reminders/events with human-friendly time parsing, recurring events, and DM/ping options for attendees.

8. Starboard & message highlights DONE
   - Implement starboard or reaction-based highlight channels, with thresholds, exclusions, and duplicate detection.

9. Invite tracking & welcome rewards
   - Track who invited new members, show leaderboard of top inviters, and implement configurable welcome rewards/roles.

10. Economy upgrades & marketplace
    - Extend economy (bank accounts, interest, item marketplace, gifting) and add safe concurrency handling and tests for transactions.

11. Analytics & command usage telemetry
    - Collect anonymized command usage metrics, guild-specific stats, and expose an admin-only endpoint for the dashboard to visualize activity.

12. Plugin system & hot-reload improvements
    - Design a plugin architecture for commands/events and complete a robust hot-reload that can add/remove commands without restart (with safety checks).

13. Tests, type coverage & CI
    - Add unit and integration tests for commands and core utilities, increase TS strictness, and wire CI to run tests and type checks on PRs.

14. Integrations (Twitch, YouTube, Webhooks)
    - Add integrations for Twitch stream announcements, YouTube uploads, and generic webhooks with templated messages and rate-limits.

/bank /bal commands
Key differences and why both are useful

Accessibility
bal (wallet): instant spend (buy, gamble, tip). Represented today by UserModel.balance.
bank: stored funds that require a withdraw action to use.

Purpose
bal: transactional day-to-day currency.
bank: savings, long-term storage, or escrow for marketplace transactions.
Mechanics you can apply to bank
Interest: periodic jobs credit a percent to bank.
Protection: immune to some game penalties (rob, tax) unless explicitly targeted.
Limits / cooldowns: withdrawals can have limits or delays.
Security/hold: can be escrowed for marketplace purchases.

UX
/bal should show both wallet and bank (e.g., “Wallet: 500g — Bank: 2,300g”).
Add /deposit <amount> and /withdraw <amount> commands (or aliases dep/wd).
Accounting & safety
Single-document updates with guarded queries ({ balance: { $gte: amount } }) are safe for moving money out of balance.
Multi-document ops (transfer buyer → seller and decrement listing) should use transactions or careful ordering with retries.