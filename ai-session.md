## VITE API URL Resolution

### Prompt

In my react front-end app I deployed to fly.io. I have an API app also deployed to fly.io. In the file I make the api calls I set the api url to const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api/"; When will this const be resolved? Do I have to make it a secret before I first deploy the web app

### AI Response

Short answer: import.meta.env.VITE_API_URL is resolved at build time, not at runtime.

Do I have to make it a secret before I first deploy?

Yes — but more precisely:

You must set VITE_API_URL before running the build step
Otherwise, your app will fall back to "http://localhost:3000/api/" and that gets baked into production

### What Your Team Did With It

- It was useful in understanding Fly secrets more and how they interact with the fly application. We learned that secrets must be set before deploying.
- It was misleading to say that just setting the VITE_API_URL as a Fly secret would resolve our entire issue. It still did not resolve the API url correctly with this. An env file was also needed to ensure it got the correct URL and to know what deployment strategy we were currently using.
- We verified the output by trying it's suggestion. From that we concluded that a Fly secret was not enough and we needed to embed some more logic in knowing what deployment strategy we were using in the front-end source code so it was easier to resolve what API url to actually use.


## Resolving Prisma Authentication and Persistent Volume Conflicts

### Prompt

Error: P1000: Authentication failed against database server, the provided database credentials for user are not valid. my .env: DB_USER=user DB_PASSWORD=password ... my .env variables should be correct. what are other sources of error?

### AI Response

Short answer: The P1000 error is a credential mismatch caused by "Stateful Persistence." PostgreSQL volumes store the initial credentials from the first time they are run, ignoring subsequent changes to the .env file.

### What Your Team Did With It

- It explained how Docker volumes "lock" initial credentials. The down -v command immediately fixed the P1000 authentication failure that had stalled our API development.
- We successfully conducted the suggested persistence test by creating a tournament, killing the containers, and verifying the data survived the restart.
- We verified the output by trying the suggestion. We modified our terminal workflow to run all Prisma commands from the root directory rather than the nested prisma folder to ensure the .env variables were always loaded.
