# =========================================================================
# 🐳 ENTERPRISE MULTI-STAGE DOCKERFILE
# =========================================================================

# Stage 1: Build Frontend Assets
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies with cached layers
COPY package*.json ./
RUN npm ci

# Copy full source and build production bundle
COPY . .
RUN npm run build

# Stage 2: Production Server Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production-only dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled frontend dist from builder
COPY --from=builder /app/dist ./dist

# Copy backend server code & database templates
COPY backend ./backend
COPY database ./database
COPY public ./public

# Expose backend API and static frontend port
EXPOSE 5000

# Healthcheck probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/datasets || exit 1

# Start enterprise production server
CMD ["node", "backend/server.js"]
