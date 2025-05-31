# ------- Stage 1: Build the client application -------
FROM oven/bun:1.2.15-alpine AS builder

# set the working directory INSIDE the container
WORKDIR /deployment

# Copy package.json and bun.lock first to leverage Bun's cache
COPY package.json bun.lock ./

# directories containing the SPA, moderation ML model, and database endpoint
COPY client/ client/
COPY server/ server/
COPY moderation/ moderation/

# install non-dev dependencies
RUN bun install --frozen-lockfile

# build the tanstack router app
# WORKDIR /deployment/client
RUN bun --filter 'client' build

# ------- Stage 2: serve the app with nginx -------
FROM nginx:alpine AS runner

# copy the built client application from the builder stage to the nginx server
COPY --from=builder /deployment/client/dist /usr/share/nginx/html

# Expose the port Nginx listens on (default HTTP port).
EXPOSE 80

# Command to start Nginx in the foreground.
CMD ["nginx", "-g", "daemon off;"]