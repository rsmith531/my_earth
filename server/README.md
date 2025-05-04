# server

Runs a simple Bun server that provides an API endpoint allowing access to the
Postgres database running in a Docker container.

## Getting started

1. Make sure to install [Docker desktop](https://docs.docker.com/desktop/setup/install/windows-install/)
2. Install dependencies: `bun install`
3. Create and seed the database: `bun run setup-dev`

To run the server: `bun run start`

To work on the database (with [Drizzle studio](https://orm.drizzle.team/docs/drizzle-kit-studio)): `bun run dev`
