# Use the newer version from the main branch
FROM node:22-alpine

# Set the working directory first
WORKDIR /app

# Install openssl (Your K8s/Prisma requirement)
RUN apk add --no-cache openssl

# Copy dependency files
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of your code
COPY . .

ARG DB_HOST
ARG DB_PORT
ARG DB_NAME
ARG DB_USER
ARG DB_PASSWORD
ARG DATABASE_URL

ENV DB_HOST=$DB_HOST
ENV DB_PORT=$DB_PORT
ENV DB_NAME=$DB_NAME
ENV DB_USER=$DB_USER
ENV DB_PASSWORD=$DB_PASSWORD
ENV DATABASE_URL=$DATABASE_URL

# 1. GENERATE using the new path to the config
RUN npx prisma generate --schema ./prisma/schema.prisma

# 2. BUILD
RUN npm run build
# ARG DATABASE_URL
# RUN npx prisma generate

EXPOSE 3000

# Start the app
CMD ["npm", "run", "start"]