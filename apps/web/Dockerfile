# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY ./package.json ./package-lock.json ./
RUN npm install

COPY . .

RUN npm run build

FROM nginx:alpine

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY start-nginx.sh /start-nginx.sh

RUN chmod +x /start-nginx.sh

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["/start-nginx.sh"]