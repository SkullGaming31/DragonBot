```markdown
# Starboard (Message Highlights)

The Starboard feature highlights notable messages in a dedicated channel when they receive a configured reaction (commonly a star emoji). DragonBot provides a persistent, guild-scoped starboard configuration and automatically posts, updates, and removes starboard messages as reactions change.

## Features

- Persistent per-guild configuration (destination channel, trigger emoji, threshold).
- Ignore lists for channels, roles, and users.
- Tracks created starboard posts so updates and deletes are idempotent.
- Commands to configure starboard without requiring database access.

## Commands

Use `/starboard` to configure the starboard for your guild. Subcommands:

- `set-channel <channel>` — Set the destination channel where starboard posts are sent.
- `set-threshold <count>` — Minimum number of reactions required to post to starboard (default: 3).
- `set-emoji <emoji>` — Emoji that triggers starboard (unicode or custom `name:id`).
- `ignore-channel <channel>` — Toggle ignoring a channel from starboard processing.

Example: set the starboard channel

```text
/starboard set-channel #starboard
```

Example: change threshold to 5

```text
/starboard set-threshold 5
```

## Event behavior

- `messageReactionAdd` — When a reaction matching the configured emoji reaches the configured threshold, DragonBot will create a starboard post in the configured channel (if not already posted). If a post exists, the bot updates the embed to reflect the current count.
- `messageReactionRemove` — When the reaction count falls below the threshold, the bot removes the starboard post and clears the mapping. If the count remains above the threshold, the embed is updated with the new count.

The bot stores a mapping of original message ID ↔ starboard message ID in the database so updates and deletes are deterministic.

## Permissions

- The bot needs permission to `Send Messages`, `Embed Links`, and `Manage Messages` (for deleting its starboard posts) in the configured starboard channel.
- When setting the starboard channel, the command will persist the channel even if the bot cannot post there; consider verifying bot permissions in the channel after setting.

## Notes & Limitations

- Rate limits: frequent edits to starboard messages or a high volume of reactions can cause rate-limit errors. For high-traffic servers consider increasing threshold or introducing batching.
- Duplicate prevention: the implementation keeps a per-guild posts[] array and ensures a message is only posted once for the configured starboard channel.
- Tests: unit tests exist to cover basic create/update/remove flows; consider adding integration tests for high-concurrency scenarios.

## Files

- Schema: `src/Database/Schemas/starboardDB.ts`
- Command: `src/Commands/Utilities/starboard.ts`
- Event handlers: `src/Events/Logs/messageReactionAdd.ts`, `src/Events/Logs/messageReactionRemove.ts`

```
