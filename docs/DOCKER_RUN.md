# Docker build & run (production)

The Compose setup runs the bot in a separate `dragonbot` container and connects it
to the existing `mongodb` container and persistent `dragonbot_mongoData_Discord`
volume. Keep `.env` in the repository root; it is passed to the container at
runtime and excluded from the image build context. The marketplace requires
MongoDB transactions. Compose configures a single-member replica set (`rs0`)
and waits for its primary before starting the bot.

**Existing installations:** Back up the MongoDB volume before changing the
running Mongo container to replica-set mode. Applying this configuration
recreates the Mongo container and initializes replica-set metadata in the
existing volume. Plan downtime and confirm the volume and network are correct
before proceeding. An existing replica set with a different configuration is
not modified automatically.

Validate the Compose configuration and build the bot image:

```sh
docker compose config --quiet
docker compose build bot
```

After the backup and migration have been approved, start the services:

```sh
docker compose up -d --build
docker compose ps -a
docker exec mongodb mongosh --quiet --eval "db.hello().isWritablePrimary"
docker logs --tail 100 dragonbot
```

After the replica set is already configured and healthy, subsequent bot-only
updates can avoid recreating Mongo:

```sh
docker compose up -d --no-deps bot
docker logs --tail 100 dragonbot
```

Notes and best practices
- Use a secrets manager (Docker secrets, Kubernetes secrets, or a cloud secrets manager) for tokens and DB credentials. Do NOT store production tokens in the repository.
- The bot connects to the `rs0` replica set using the Compose network hostname `mongo` and the database named by `MONGO_DB` (default `dragonbot`), rather than a host-local or external URI. Host-side clients may need a direct connection because `mongo` is resolvable inside the Compose network.
- The existing Mongo network and data volume are declared external so Compose will not create or remove them.
- The host port is taken from `PORT` in `.env` (default `3000`).
- Run the container behind a reverse proxy (NGINX / Traefik) that handles TLS termination and rate-limiting if needed.
- Monitor the health endpoint `/api/v1/health` and configure alerts on unhealthy containers.
- If you run multiple instances, replace the in-memory rate limiter with a Redis-backed store.
