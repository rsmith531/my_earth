# server\Dockerfile

# TODO: update so that it only works with the server project instead of
# involving the moderation and client projects that are in the monorepo. Also
# explore optimizations and best practices.

# ------- Stage 1: Build the Hono server application -------
FROM oven/bun:1.2.15-alpine AS builder

WORKDIR /deployment

# Copy package.json and bun.lock first for caching
COPY package.json bun.lock ./

COPY client/ client/
COPY server/ server/
COPY moderation/ moderation/

# Install dependencies
RUN bun install --frozen-lockfile

RUN bun --filter 'server' build

# ------- Stage 2: Run the Hono server -------
# Use the same Bun base image for consistency and environment
FROM oven/bun:1.2.15-alpine AS runner

# Set the working directory for the runtime
WORKDIR /deployment/server

# copy only the dist files from the build stage for production
COPY --from=builder /deployment/server/dist ./dist

# Manually copy the required TensorFlow.js WASM assets.
# This creates the necessary directory structure for the runtime to find them.
COPY --from=builder /deployment/node_modules/@tensorflow/tfjs-backend-wasm/wasm-out /deployment/node_modules/@tensorflow/tfjs-backend-wasm/wasm-out

# copy the python script, too
COPY --from=builder /deployment/server/getVisibleSurfaceRadius.py ./

# copy database files so they can be used to generate migrations
COPY --from=builder /deployment/server/db/drizzle.config.ts ./db/drizzle.config.ts
COPY --from=builder /deployment/server/db/schema.ts ./db/schema.ts

# install python, alpine distro uses apk instead of apt
RUN apk update && apk add python3

# Expose the port your Hono server listens on.
# API_SERVER_PORT will be provided at runtime via Docker Compose or environment variables.
ENV API_SERVER_PORT=4001
EXPOSE ${API_SERVER_PORT}

# Command to run your Hono server.
# This assumes your server's entry point after build is `dist/index.js`
# and it reads the API_SERVER_PORT from its environment.
CMD ["bun", "dist/index.js"]
