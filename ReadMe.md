### Development Guide

There are 3 main files that are not in the repo that are needed to deploy the app both locally and on fly.io. Please refer to the email for these files.

1. .env in the root directory
2. .env in the apps/web directory
3. secrets.yaml in /k8s directory

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
4. From the root directory compose the app containers

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

# Create a persistent PostgreSQL app

1. Run the following command.

```
fly postgres create --name {tournament-db} --region yyz
```

2. Select "Development" (Lowest CPU/RAM).
3. Enter “y” to “Scale single node pg to zero after one hour? (y/N).”
4. Wait for app to be created.

# Create the api back-end app

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

# Create the web front-end app

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
