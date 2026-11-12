# Use official Node.js LTS image
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY backend/package*.json ./
RUN npm ci

# Copy source code
COPY backend/ .

# Build (if TypeScript) and generate Prisma client
RUN npm run build || echo "No build script"
RUN npx prisma generate

# Runtime image
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm","start"]
