# User Guide

This section will go through steps on how to properly use the Tournament Tracker application, specifically all core features.

## Creating an account

1. Access the front-end application from whatever deployment option being used.

2. From the home page, click login on the top right corner.

![Home page login](assets/home-page-login.png)

From the login page click the _Don't have an account? Sign Up_ link at the bottom.

Once there enter a username, Email, and password and click _Sign Up_. This should create the account then navigate to the home page again.

![Sign up page](assets/sign-up-page.png)

## Creating a Tournament

1. Login to the website, refer to the previous section to create an account.
2. From the home page click the _Open Create Form_ button.

![Button to create tournament from home page](assets/create-tournament-home.png)

3. From there, enter the name/details of the tournament and click _Create Tournament_.

![Create Tournament page](assets/create-tournament-page.png)

## Viewing Tournament Details

There are a few options to get to the details page of any tournament

1. From the home page search for the tournament in the **Search Tournaments By Name** section. Click the tournament of interest.

![Search tournament from home screen](assets/search-tournament-home.png)

2. If logged in and either the creator or a player in the tournament, find the tournament in the **Search Tournaments By Name** section.

![My tournaments from home screen](assets/my-tournaments-home.png)

3. Once the tournament is clicked the details page should open:

![Tournament details page](assets/tournament-details-page.png)

From the tournament details page, the url can be shared with others so that they may have a direct link to this specific tournament's details.

## Joining a Tournament as a Player

To join a tournament as a player:

1. Sign in to an account that did not create the tournament of interest.
2. Go to the tournament details (refer to the previous section for more info on how to get there).
3. From there, if there are fewer than 6 people already in the tournament, an option to join the tournament should appear near the top, and allow you to set a ranking.
4. Click the _Join Tournament_ button.

![Join tournament button](assets/join-tournament-button.png)

## Editing Tournament Results

Editing tournament results only becomes available once the tournament is filled with 6 players, so make sure to have 6 accounts join.

1. Sign in to the account that created the tournament.
2. Go to the tournament details page for the tournament of interest.
3. The Quarterfinals matchups should be created once entering as the creator.

![Matchups set](assets/matchups-set.png)

4. For each matchup, set the status to completed, then select a winner from the dropdown.
5. Save each matchup as they are set to persist in the database.

![Save matchup results](assets/results-save.png)

5. Do this for all matchups in the quarterfinal, semifinals, then finals.
6. Once completed a tournament winner should be shown in the bottom of the screen.

![Completed Tournament](assets/tournament-final.png)

# Development Guide

In order to deploy the Tournament Tracker application, both locally or on fly.io, there are a few steps to make sure the deployment is consistent from everyone with the repository. The complete steps to deploy the app are given in this section.

## Important files not in Repository

There are 3 main files that are not in the repository that are needed to deploy the app both locally and on fly.io. Please refer to the email for these files.

1. .env in the root directory. The file location should end up being:

```
ECE1779Project/.env
```

2. .env in the apps/web directory. The file location should end up being:

```
ECE1779Project/apps/web/.env
```

3. secrets.yaml in kubernetes directory. The file location should end up being:

```
ECE1779Project/k8s/secrets.yaml
```

## Installing Dependencies

Before deploying the app anywhere, the dependencies for the app must be installed in order to compile it correctly.

1. Navigate to api app

```
cd apps/api
```

2. Install dependencies

```
npm install
```

3. Navigate to web app

```
cd ../web
```

4. Install dependencies

```
npm install
```

## Docker Compose Deployment (on Docker Desktop)

1. Ensure .env is in root directory of the repository.
2. Ensure the .env in apps/web/ has the VITE_API_URL commented out.
3. Ensure Docker Desktop app is on and fully loaded.
4. From the root directory compose the app containers run Docker compose.

```
docker compose up --build -d
```

5. Wait for deployment to complete
6. Access front-end app from:

```
http://localhost:5172/
```

## Kubernetes Deployment (in Minikube)

1. Initialize Minikube

```
minikube start
```

2. Ensure minikube is running

```
minikube status
```

3. Navigate to api app

```
cd apps/api
```

4. Build docker image of api

```
docker build -t tournament-api-k8s:1.0 .
```

5. Load image in minikube docker daemon

```
minikube image load tournament-api-k8s:1.0
```

6. Navigate to web app

```
cd ../web
```

7. Build docker image of web

```
docker build -t tournament-web-k8s:1.0 .
```

8. Load image in minikube docker daemon

```
minikube image load tournament-web-k8s:1.0
```

9. Navigate to the k8s directory

```
cd ../../k8s
```

10. Ensure secrets.yaml is in there (should have been emailed)

11. Apply all yaml files

```
kubectl apply -f .
```

12. Wait for all pods to be running (api-deployment may show error while db is still being created)

```
kubectl get pods
```

13. Get the url for the web service

```
minikube service web-service --url
```

14. Enter frontend from the given url

15. Once done with testing, ensure minikube is reset

```
minikube delete
```

## Fly.io Deployment

### Create a persistent PostgreSQL app

1. Run the following command.

```
fly postgres create --name {tournament-db} --region yyz
```

2. Select "Development" (Lowest CPU/RAM).
3. Enter “y” to “Scale single node pg to zero after one hour? (y/N).”
4. Wait for app to be created.

### Create the api back-end app

1. Navigate to the api app

```
cd apps/api
```

2. Configure fly.toml.

```
app = '{tournament-api}'
```

3. Initialize the fly app.

```
fly launch --copy-config --no-deploy
```

4. Answer NO to "Tweak settings".
5. Attach db app to api app.

```
fly postgres attach {tournament-db} --app {tournament-api}
```

6. Set JWT Secret (should be given in email).

```
fly secrets set JWT_SECRET={JWT_SECRET} --app {tournament-api}
```

7. Deploy api app.

```
fly deploy --app {tournament-api}
```

8. Wait for app to be deployed.

### Create the web front-end app

1. Navigate to the web app

```
cd ../web
```

2. Configure fly.toml.

```
app = '{tournament-web}'
```

3. Initialize the fly app.

```
fly launch --copy-config --no-deploy
```

4. Answer NO to "Tweak settings".
5. Update VITE_API_URL web .env in apps/web/.env

```
VITE_API_URL=https://{tournament-api}.fly.dev/api/
```

6. Deploy api app.

```
fly deploy --app {tournament-web}
```

7. Wait for app to be deployed.

## Access Fly.io app

The front-end application should then be accessible from

```
https://{tournament-web}.fly.dev
```
