<h1 align="center">Contributing</h1>

## Configuring the development environment

### First steps

1. Make sure you have [bun](https://bun.sh/docs/installation) and [Docker](https://docs.docker.com/engine/install/) installed.

2. <code className="language-shell">bun install</code>.

### Database and API endpoint

1. Create the following environment variables in `server/.env`:

    ```shell
    PG_PW=<pick_a_password>
    PG_DB=my_earth_db_local
    PG_USER=local_user
    DATABASE_URL=postgresql://local_user:<same_as_pg_pw>@localhost:4002/my_earth_db_local
    API_SERVER_PORT=4001
    ```

2. <code className="language-shell">bun --filter 'server' setup-dev</code>
    - Creates a Docker container using the PostGIS image on Dockerhub and apply any migrations necessary to match the database to the [schema](server/db/schema.ts). Then, it seeds the database with 5000 rows of Lorem ipsum dummy data.
    - Alternatively, if you don't want the database seeded: <code className="language-shell">bun --filter 'server' db-create</code>

### Web application

1. Create the following environment variables in `client/.env`:

    ```shell
    VITE_DATABASE_ENDPOINT=http://localhost:4001
    ```

## To work in development mode

1. Active development should occur in a branch specific to the GitHub issue being worked on. Make sure to assign yourself and link your branch to the issue before you begin work.

2. To start the database and API endpoint: <code className="language-shell">bun --filter 'server' dev</code>
    - A lightweight database dashboard is available at https://local.drizzle.studio/.

3. To start the web application: <code className="language-shell">bun --filter 'client' dev</code>

## Developing React components

We use Storybook to merge development with documentation. Component files should have a `.stories.tsx` file that shares its file name. Please make sure there is a story to demonstrate all states and variants of a component when reasonable.

To get started, run <code className="language-shell">bun --filter 'client' storybook</code>

## Tests

When possible, write robust tests for new features and make sure tests for existing features still pass by running <code className="language-shell">bun test</code>.

## Documentation

New features should have documentation written as physically close to their implementation as practicable. Usually this looks like a JSDoc comment written adjacent to a function. Try to be detailed, but succinct.

## Deployment

When the work on a feature is completed, open a pull request and complete the relevant sections of the template. An approving review and all tests passing is required before a PR can be merged.

Once merged, the updated application will be deployed to staging via a GitHub action runner.

## License

By contributing your code to this GitHub repository, you agree to license your contribution under [the same license](LICENSE.md) the repository operates with.

## Troubleshooting

### `EADDRINUSE`

```shell
netstat -aon | findstr <port>
taskkill /f /pid <PID>
```

### To view the environment variables currently set on a container

```shell
docker exec <container name> /bin/sh -c /usr/bin/env
```
