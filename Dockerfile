# ============================================================
# BalanceVault Backend – Dockerfile (placed at repo root)
# ============================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy backend package files and install dependencies
COPY backend/package*.json ./
RUN npm ci

# Copy the entire backend source
COPY backend/ .

# Build TypeScript
RUN npm run build

# Generate Prisma client (uses schema at prisma/schema.prisma)
RUN npx prisma generate

# ---- Runtime image ----
FROM node:20-alpine
WORKDIR /app

# Copy built output from builder
COPY --from=builder /app ./

ENV NODE_ENV=production
EXPOSE 3000

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
