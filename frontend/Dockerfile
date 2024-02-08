FROM node:20-alpine as build-deps

WORKDIR /usr/src/app
COPY . .

ENV NODE_OPTIONS --openssl-legacy-provider

RUN    npm config set maxsockets=5 \
    && npm install \
    && npm run build

FROM nginx:alpine

ENV DOCKERIZE_VERSION v0.7.0
RUN    wget -O /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_x86_64 \
    && chmod +x /usr/local/bin/dumb-init \
    && wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

WORKDIR /usr/share/nginx/html

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build-deps /usr/src/app/build /var/www/public
COPY nginx /etc/nginx
COPY scripts /ticketz-scripts

ENTRYPOINT ["dumb-init", "--"]
CMD    sh /ticketz-scripts/envtojson.sh > /var/www/public/config.json \
    && nginx -g "daemon off;"
