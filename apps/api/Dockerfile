# Use the newer version from the main branch
FROM node:22-alpine

# Set the working directory first
WORKDIR /app

# Install openssl (Your K8s/Prisma requirement)
RUN apk add --no-cache openssl

# Copy dependency files
COPY package*.json ./
RUN npm install

# Copy the rest of your code
COPY . .

# 1. GENERATE using the new path to the config
RUN npx prisma generate --config src/prisma.config.ts

# 2. BUILD
RUN npm run build

EXPOSE 3000

# Start the app
CMD ["npm", "run", "start"]