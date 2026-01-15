**Issue #69 — Integrations (Twitch, YouTube, Webhooks)**

Goal

- Provide integrations to announce Twitch stream starts/stops, YouTube uploads/publishes, and accept generic webhook-driven notifications with templated messages and rate-limiting.

Design overview

- New service: `Integrations` (backend + adapters)
  - HTTP webhook receiver at `POST /api/v1/integrations/webhook` (authenticated via secret header)
  - Adapter interface for sources (Twitch, YouTube, generic)
  - Message templating using existing utilities (or a small template helper)
  - Per-guild configuration (enabled integrations, channel id, template, rate limits)

Security & reliability

- Authenticate incoming webhooks using a shared secret (`INTEGRATIONS_SECRET`) or per-source verification (Twitch signature, YouTube PubSub verification).
- Persist events and deduplicate by provider event id to avoid duplicate announcements.
- Rate-limit per-guild to protect channels.

Minimal API contract

- POST /api/v1/integrations/webhook
  - Headers: `x-integration-source: twitch|youtube|generic`, `x-integration-signature` (optional)
  - Body: JSON payload forwarded from provider
  - Response: 200 OK on accepted, 4xx for auth/validation errors

Adapter responsibilities

- Parse provider payload → normalized event { provider, eventType, id, title, url, channel, metadata }
- Validate signature when applicable
- Return normalized event to main service for routing to configured guilds

Storage / config

- Add a small Mongoose schema `IntegrationConfig` with fields: guildId, provider, enabled, channelId, template, rateLimitWindowSec

Acceptance criteria

- The bot can receive a Twitch stream-start event and post a templated message to a configured channel.
- Duplicate events are not posted twice.
- Webhook endpoint enforces a secret and returns appropriate HTTP codes.

Next steps (implementation order)

1. Add `src/Integrations/` scaffolding and config schema.
2. Implement generic webhook receiver route in `routes/apiv1.ts` (protected path).
3. Implement Twitch adapter (stream start/stop). Verify with test payloads.
4. Implement YouTube adapter (PubSub or webhook payload). Verify with test payloads.
5. Add per-guild UI/command or config loader to set channel and template.
6. Add tests and docs; update README and example env vars.

Env vars to add/use

- `INTEGRATIONS_SECRET` — shared secret for generic webhooks
- `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` — if validating Twitch webhooks
- `YOUTUBE_PUBSUB_SECRET` — for YouTube PubSub verification

If you'd like, I can scaffold the `src/Integrations` folder and the webhook route next. Which should I implement first: Twitch adapter or the generic webhook receiver?
