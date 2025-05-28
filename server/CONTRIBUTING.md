# To get the server up and running

1. Make sure you have [bun](https://bun.sh/docs/installation) and [Docker](https://docs.docker.com/engine/install/) installed.

2. `bun install`.

3. Create the following environment variables:

    ```bash
    DATABASE_URL=postgresql://postgres:<password>@<hostname>:4002/my_earth_db
    API_SERVER_PORT=4001
    ```
4. In a **`bash`** terminal: `bun run db-create`

# To work in development mode:

1. `bun run dev`

2. A lightweight database dashboard is available at https://local.drizzle.studio/.