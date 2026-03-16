FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

# Install ALL dependencies (including typescript and prisma)
RUN npm install

COPY . .

# 1. GENERATE the Prisma Client first
RUN npx prisma generate --schema ./prisma/schema.prisma

# 2. BUILD the TypeScript into JavaScript (creates the /dist folder)
RUN npm run build

EXPOSE 3000

# This command runs migrations and then 'node dist/index.js'
CMD ["npm", "run", "start"]