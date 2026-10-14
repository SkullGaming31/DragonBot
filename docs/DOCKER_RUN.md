# Docker build & run (production)

The Compose setup runs the bot in a separate `dragonbot` container and connects it
to the existing `mongodb` container and persistent `dragonbot_mongoData_Discord`
volume. Keep `.env` in the repository root; it is passed to the container at
runtime and excluded from the image build context.

Validate the Compose configuration and build the bot image:

```sh
docker compose config --quiet
docker compose build bot
```

If the existing Mongo container is stopped, start it and verify it responds:

```sh
docker start mongodb
docker exec mongodb mongosh --quiet --eval "db.adminCommand('ping').ok"
```

Start only the bot service so Compose does not recreate or modify the existing
Mongo container:

```sh
docker compose up -d --no-deps bot
docker logs --tail 100 dragonbot
```

Notes and best practices
- Use a secrets manager (Docker secrets, Kubernetes secrets, or a cloud secrets manager) for tokens and DB credentials. Do NOT store production tokens in the repository.
- The bot connects to MongoDB using the Compose network hostname `mongo` and the database named by `MONGO_DB` (default `dragonbot`), rather than a host-local or external URI.
- The existing Mongo network and data volume are declared external so Compose will not create or remove them.
- The host port is taken from `PORT` in `.env` (default `3000`).
- Run the container behind a reverse proxy (NGINX / Traefik) that handles TLS termination and rate-limiting if needed.
- Monitor the health endpoint `/api/v1/health` and configure alerts on unhealthy containers.
- If you run multiple instances, replace the in-memory rate limiter with a Redis-backed store.
