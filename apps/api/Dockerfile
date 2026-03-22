FROM node:20-alpine

RUN apk add --no-cache openssl

FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 1. GENERATE using the new path to the config
RUN npx prisma generate --config src/prisma.config.ts

# 2. BUILD (this will put prisma.config.js into /dist)
RUN npm run build

EXPOSE 3000

# This will now use your updated 'start' script from package.json
CMD ["npm", "run", "start"]