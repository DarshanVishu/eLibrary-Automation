# Use Node.js 22 image
FROM node:22-bookworm AS base

# Install pnpm globally
FROM base AS deps
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Disable failing on ignored build scripts
RUN echo "strict-dep-builds=false" > .npmrc

# Disable Husky during docker build
ENV HUSKY=0

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build the application
FROM deps AS builder
WORKDIR /app

# Copy source code
COPY . .

# Load build-time env vars (placeholders so Next.js doesn't throw on
# missing Supabase config during static analysis — real values come at runtime)
COPY .env.docker .env

# Build the application
RUN pnpm run build


# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
