FROM node:20-alpine as build-deps

WORKDIR /usr/src/app
COPY . .

ENV NODE_OPTIONS --openssl-legacy-provider

RUN    npm install \
    && echo -e "\n\nBulding...\n" \
    && npm run build

FROM nginx:alpine

ENV DOCKERIZE_VERSION v0.7.0
RUN    wget -O /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_$(uname -m) \
    && chmod +x /usr/local/bin/dumb-init \
    && LARCH=$(if [ "$(uname -m)" == "aarch64" ] ; then echo "arm64" ; elif [ "$(uname -m)" == "x86_64" ] ; then echo "amd64" ; else uname -m ; fi) \
    && wget -O /usr/local/bin/dockerize.tar.gz https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-${LARCH}-${DOCKERIZE_VERSION}.tar.gz \
    && tar -C /usr/local/bin -xzvf /usr/local/bin/dockerize.tar.gz \
    && rm /usr/local/bin/dockerize.tar.gz

WORKDIR /usr/share/nginx/html

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build-deps /usr/src/app/build /var/www/public
COPY --from=build-deps /usr/src/app/node_modules/@socket.io/admin-ui/ui/dist /var/www/public/socket-admin
COPY nginx /etc/nginx

ENTRYPOINT ["dumb-init", "--"]
CMD (echo "{" && while IFS='=' read -r name value; do \
        printf '\t"%s": "%s"\n' "$name" "$value"; \
    done < <(env) | sed '$!s/$/,/' && echo "}")  > /var/www/public/config.json \
    && nginx -g "daemon off;"
