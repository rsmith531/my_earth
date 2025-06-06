## Technical Summary

I am trying to limit the scope of the project so that there is no single part that demands an imbalanced level of attention when compared to any other part of the project. This basically shakes out to writing just a few webpages, having a not-very-complex database schema, limited opportunities for users to input data that needs handling, and minimal amounts of data fetching. That means reduced amount of deliverables focused on any given section, which increases the opportunity to explore a variety of technologies. At a high level, I wanted to learn about [the Tanstack suite](https://tanstack.com/) of web development tools, type-safe APIs, basic [GIS](https://www.usgs.gov/faqs/what-a-geographic-information-system-gis) capabilities in Javascript, and machine learning. Along the way I got to dabble in some small, specialized solutions for less prominent but still very interesting problems.

### Front-end

The front end is built with [React](https://react.dev/) using the [shadcn](https://ui.shadcn.com/) component library. [Tailwind](https://tailwindcss.com/) made styling easy with its utilities and theming variables. They had also [recently released version 4](https://tailwindcss.com/blog/tailwindcss-v4) when I started work on this project, so it was cool to see the improvements they made over the prior version.

There's only one form on website (thankfully) and it's implemented with [React Hook Form](https://react-hook-form.com/). This library claims to be born out of a desire to make form components more performant than existing solutions. My previous experience is with [Formik](https://formik.org/) and is the source of many headaches, so this library was a breath of fresh air, especially when paired with [Zod](https://v3.zod.dev/) for input validation.

The webpages themselves are served with [Tanstack Router](https://tanstack.com/router/latest) I had been hearing much talk about what Tanstack is doing for web development these days and I wanted to see about the hype for myself. Partway into development I realized that if I wanted server-side rendering I was going to have to use [Tanstack Start](https://tanstack.com/start/latest). I was early enough along in the project that I started converting it, but a few hours of struggling reminded me how much of a pain it is to do SSR, and that was not one of the core goals of this project, so I just went back to how it was to begin with.

Tanstack also has a state management solution called [Query](https://tanstack.com/query/latest) that I have prior experience with, so that was pretty straightforward to add in for data fetching.

### Back-end

#### Database

Most of my projects use [SQLite](https://www.sqlite.org/) because it's real easy to get working and simple to maintain over the life of the project since you don't have to worry about a database server. I've used [Postgres](https://www.postgresql.org/) in the past with [Supabase](https://supabase.com/), so I thought this would be a good opportunity to explore it further without the hand-holding that Supabase does for you. Plus, it gave me access to the [PostGIS extension](https://postgis.net/) that I'll discuss more about later on.

As it turns out, you can get a Postgres server spun up with minimal fuss by putting it in [a Docker container](https://hub.docker.com/_/postgres). I used the [PostGIS Docker image](https://hub.docker.com/r/postgis/postgis) since it came with the extension prepackaged.

[Drizzle ORM](https://orm.drizzle.team/) is my favorite way to define a database schema, so that's how I wrote up the two whole tables that store the website's data: 

<insert image of schema here>

It also provides a great way to generate and apply migrations as the schema evolves and gives very robust Typescript types to build queries and create interfaces with.

#### API Endpoint

To make the database available to the internet at large, I built a simple API out of [Hono](https://hono.dev/):

<insert api map here>

Zod once again proved its worth by stepping in to validate incoming requests. It made putting together the API handlers a breeze, since I knew the exact data types to expect to receive from requests.

Something I've struggled with in the past is not having type safety between an API and the fetch requests that access it. I had heard of a library called [tRPC](https://trpc.io/docs) that tries to solve this problem, but Hono has [its own built-in answer](https://hono.dev/docs/guides/rpc) so that's what I went with. It was a little bit nuanced since you have to chain the handlers to the app so that the types flow through, and that wasn't made overtly obvious [in the docs](https://hono.dev/docs/guides/rpc#using-rpc-with-larger-applications).

### Machine Learning

Because of the fact that this website is publicly accessible by anyone on the internet, and my knowledge of the [type of people](https://www.youtube.com/watch?v=ROaj3bCpZEM) that frequent the internet, I knew it would be foolhardy to create a place for anyone to write anything and have it on display without any attempt at moderating the content. I also knew I wasn't getting anyone (namely me) to sit on a dashboard and face a deluge of the worst the internet has to offer. Lucky for me, this presented a great opportunity to delve into the world of machine learning and more specifically its natural language processing features.

[Tensorflow](https://www.tensorflow.org/) trained this model called [Toxicity](https://www.kaggle.com/models/tensorflow/toxicity/) to accept a string and classify its content against several categories of toxic language. Now, they clearly state up front that it shouldn't be used for automated content moderation, and after playing around with it I can totally see why, but beggars can't be choosers and it now serves as the cornerstone of the site's moderation.

Working with it turned out to be quite simple, to the point where I felt like it abstracted away a lot of the work that it takes to do machine learning. I plan to augment or replace it with a model I train on data I'm collecting from user submissions to the website. I don't know what that looks like yet, or how monumental it'll turn out to be, but it seems like a straightforward way to immerse myself in an unfamiliar field of expertise.

### Deployment

The most challenging part of all my projects is getting them deployed; This one was no different. First, I had to figure out what the deployed version was going to look like. Previously I had just copied some build files onto a VPS and used [pm2](https://pm2.io/) to run them, but this time I had a Docker container (the database) to worry about. So I innocently opened the gates unto the world that is containerized applications and stepped in just far enough to learn about [Docker Compose](https://docs.docker.com/compose/), stopping well short of Kubernetes.

The next step was getting the project out of its repo and onto the VPS. This involved creating workflows that use [Github Actions](https://github.com/features/actions) runners to perform the steps of building the Docker images, uploading them to the [Github container registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry), and opening an SSH connection to the VPS to download and deploy them on the server.

I learned that automating workflows really forces you to address all those janky setups you made in your dev environment that you've been getting around with manual intervention. Some pitfalls I came across in this process included:

- Not including the one Python file I wrote to experiment with IPC in the build files.
- Storing the correct environment variables in Github properly.
- Incorrectly configuring the ports and connection URLs for the deployed environment.

This whole rigamarole ate up one whole weekend and then some just to get a staging environment working, but I feel like I learned something and I'm glad I did it.

I'd like to further expand on it by implementing a second "production" environment that uses [blue-green deployments](https://en.wikipedia.org/wiki/Blue%E2%80%93green_deployment) to minimize downtime when pushing updates into production.

### Development Tooling

- [Bun](https://bun.sh/):
    - As a package manager: I've heard it making waves as the latest superstar, so I wanted to give it a spin. My conclusion: It definitely works way better than npm and is noticeably faster than Yarn.
    - As a monorepo: As I kept developing the project, I noticed it had three distinct areas of concern: the web app, the database and its API endpoint, and the moderation tool. Bun's [workspaces](https://bun.sh/guides/install/workspaces) made it easy to split these out and follow a monorepo pattern for the project. This strategy paid off when it came time to containerize the project, too.
    - As a test suite: Honestly, I'm not sure what [`bun test`](https://bun.sh/docs/cli/test) does better than Vitest or Jest, but I figured I might as well stay within the ecosystem since I have it.
- [Storybook](https://storybook.js.org/): When I first started using Storybook it took me a while to warm up to it because it felt pretty finicky to work with and the learning curve was high. Now, I'm a big fan of its ability to fill multiple roles. I can develop components in isolation, the component becomes self-documented, I get an index of all the components in the project, and I can write interaction tests.
- [Typescript](https://www.typescriptlang.org/): Honestly I don't know how anyone survives working on projects written in vanilla Javascript. At the first hint of a refactor I'd be quivering in my boots.
- [Knip](https://knip.dev/): Project clutter really grinds my gears. I think it reduces code discoverability, hides bugs, and slows down development in several ways.
- [Biome](https://biomejs.dev/): Similarly, Biome does a great job on keeping code organized and encourages me to stick to best practices while I'm writing.

### Misc

#### Interprocess Communication

Something that's always been a little mysterious to me is getting two programming languages to talk to each other. Since Python is known to be a data analysis powerhouse, I thought my need for determining how much of the Earth's surface is visible from a given viewpoint would be a great reason to try inter-process communication.

Bun let me run the Python script as a [child process](https://bun.sh/docs/api/spawn) and listen for the output it returns. 

After much deliberation, it turned out I just needed to perform three simple geometry calculations to get the number I needed and switching to Python to do that was super overkill, but hey, that's what learning is for I guess.

#### The Visible Portion of the Earth's Surface

- Turf.js

#### Debouncing versus Throttling

As a user changes the position of their viewpoint over the Earth's surface, new data is fetched. This would mean a new fetch request would go out for every update to the coordinates or altitude, inundating the API endpoint with traffic. I wanted to make it so that a single, most recent request would be sent from a given set of requests. My first thought was that would require a debounce mechanism, but it actually needed throttling.

In another place, the user has a slider that lets them adjust the number of results they see. Here, I only wanted to send a fetch request after the user finished adjusting the slider and the value settled at their chosen setting. This scenario did need a debounce mechanism.

The difference was that the first case required some requests in the stream to get through as the stream continued, and the second case only required the last request in a finite stream to get through. [Tanstack Pacer](https://tanstack.com/pacer/latest/docs/overview) has both of those capabilities and more.

#### An Interactive Planet

- React-globe.gl

### Closing Thoughts
