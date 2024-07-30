# Stage 1: Build the application
FROM node:20 AS build

WORKDIR /usr/src/app
COPY . .

RUN npm install \
    && npm run build

# Stage 2: Create the final image without source files
FROM node:20

WORKDIR /usr/src/app

# Install dumb-init and dockerize
ENV DOCKERIZE_VERSION v0.7.0
RUN wget -O /usr/local/bin/dumb-init https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_$(uname -m) \
    && chmod +x /usr/local/bin/dumb-init \
    && wget -O /usr/local/bin/dockerize.tar.gz https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-$(dpkg --print-architecture)-${DOCKERIZE_VERSION}.tar.gz \
    && tar -C /usr/local/bin -xzvf /usr/local/bin/dockerize.tar.gz \
    && rm /usr/local/bin/dockerize.tar.gz

# Copy only the necessary build artifacts from the build stage
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/package.json ./package.json

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD dockerize -wait tcp://${DB_HOST}:5432 -timeout 60s \
  && npx sequelize db:migrate \
  && npx sequelize db:seed:all \
  && node dist/server.js
