# ---------- Stage 1: build ----------
FROM node:24-bookworm-slim AS build
WORKDIR /app

# Prisma's query engine needs OpenSSL.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies first so Docker can cache this layer when only code changes.
COPY package.json package-lock.json ./
RUN npm ci

# Generate the Prisma client for Linux (inside the container, not your Windows one).
COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Drop dev dependencies (typescript, tsx, prisma CLI...) to keep the image small.
RUN npm prune --omit=dev

# ---------- Stage 2: run ----------
FROM node:24-bookworm-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=8000

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Don't run as root.
USER node
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:'+process.env.PORT+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/server.js"]
