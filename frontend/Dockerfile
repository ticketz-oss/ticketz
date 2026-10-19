FROM node:22-alpine as build-deps

WORKDIR /usr/src/app
COPY . .

ENV NODE_OPTIONS --openssl-legacy-provider

RUN npm ci && npm run build

FROM ghcr.io/ticketz-oss/nginx-alpine

WORKDIR /usr/share/nginx/html

COPY --from=build-deps /usr/src/app/build /var/www/public
COPY --from=build-deps /usr/src/app/node_modules/@socket.io/admin-ui/ui/dist /var/www/public/socket-admin
COPY nginx /etc/nginx
COPY docker-entrypoint.sh /usr/local/bin/ticketz-entrypoint.sh
RUN chmod +x /usr/local/bin/ticketz-entrypoint.sh

CMD ["/usr/local/bin/ticketz-entrypoint.sh"]
