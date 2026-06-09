# syntax=docker/dockerfile:1
# Multi-stage build: install/build in a full Node image, then run from a slim runtime image as non-root

FROM node:18-bullseye AS builder

WORKDIR /app
# Ensure devDependencies (like TypeScript) are installed during the build
ENV NODE_ENV=dev

# Copy package files first to leverage caching
COPY package.json package-lock.json* ./

# Install dev deps for build (if any)
RUN npm ci --unsafe-perm --no-progress || npm install --no-progress

# Copy source and build
COPY . .
RUN npm run build

### Production image
FROM node:18-bullseye-slim
WORKDIR /app

# Minimal env defaults
ENV NODE_ENV=prod
ENV PORT=3000

# Create a non-root user to run the process
RUN groupadd -r app && useradd -r -g app -d /home/app -s /usr/sbin/nologin app || true

# Copy package files and install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund --no-progress || npm install --production --no-audit --no-fund --no-progress

# Copy built artifacts and static assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/assets ./assets

# Copy helper script to wait for MongoDB and make it executable
COPY docker/wait-for-mongo.sh /usr/local/bin/wait-for-mongo.sh
RUN chmod +x /usr/local/bin/wait-for-mongo.sh || true
RUN chown app:app /usr/local/bin/wait-for-mongo.sh || true

# Ensure correct permissions for the non-root user
RUN chown -R app:app /app
USER app

EXPOSE 3000

# Lightweight healthcheck (expects the app to expose /api/v1/health)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const http=require('http');const opts={host:'127.0.0.1',port:process.env.PORT||3000,path:'/api/v1/health',timeout:2000};const req=http.get(opts,res=>{if(res.statusCode!==200)process.exit(1);process.exit(0);});req.on('error',()=>process.exit(1));" || exit 1

# Start the compiled app (wait for Mongo first)
CMD ["bash", "-c", "/usr/local/bin/wait-for-mongo.sh mongo 27017 && node dist/src/index.js"]
