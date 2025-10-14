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

"""
Add more notes here as the work progresses.
"""
