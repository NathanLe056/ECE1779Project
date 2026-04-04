## VITE API URL Resolution

### Prompt (you sent to AI)

In my react front-end app I deployed to fly.io. I have an API app also deployed to fly.io. In the file I make the api calls I set the api url to const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api/"; When will this const be resolved? Do I have to make it a secret before I first deploy the web app

### AI Response (trimmed if long)

Short answer: import.meta.env.VITE_API_URL is resolved at build time, not at runtime.

Do I have to make it a secret before I first deploy?

Yes — but more precisely:

You must set VITE_API_URL before running the build step
Otherwise, your app will fall back to "http://localhost:3000/api/" and that gets baked into production

### What Your Team Did With It

1-3 bullet points describing:

- It was useful in understanding Fly secrets more and how they interact with the fly application. We learned that secrets must be set before deploying.
- It was misleading to say that just setting the VITE_API_URL as a Fly secret would resolve our entire issue. It still did not resolve the API url correctly with this. An env file was also needed to ensure it got the correct URL and to know what deployment strategy we were currently using.
- We verified the output by trying it's suggestion. From that we concluded that a Fly secret was not enough and we needed to embed some more logic in knowing what deployment strategy we were using in the front-end source code so it was easier to resolve what API url to actually use.
