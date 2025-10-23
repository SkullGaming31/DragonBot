# Docker build & run (production)

These instructions build a production image and run it with a named volume for persistent data.

1. Build the image (from the repo root):

```pwsh
docker build -t dragonbot:latest .
```

2. Create a dedicated volume for persistent data (optional):

```pwsh
docker volume create dragonbot-data
```

3. Run the container with environment variables supplied via a file or your orchestrator.
   Example (using an env file `.env`):

```pwsh
docker run -d \
  --name dragonbot \
  --mount source=dragonbot-data,target=/app/data \
  --env-file .env \
  -p 3000:3000 \
  --restart unless-stopped \
  dragonbot:latest
```

Notes and best practices
- Use a secrets manager (Docker secrets, Kubernetes secrets, or a cloud secrets manager) for tokens and DB credentials. Do NOT store production tokens in the repository.
- Run the container behind a reverse proxy (NGINX / Traefik) that handles TLS termination and rate-limiting if needed.
- Monitor the health endpoint `/api/v1/health` and configure alerts on unhealthy containers.
- If you run multiple instances, replace the in-memory rate limiter with a Redis-backed store.
