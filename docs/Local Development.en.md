# Local development environment setup

> **WARNING**
>
> This is a setup exclusively for local development.
>
> DO NOT TRY TO RUN THIS ON A PUBLIC AVAILABLE SERVER

## Install Docker

The suggested development setup uses Docker to run two dependencies: `postgres` and `redis`, it also sets up a container running `pgadmin4` if you feel the need to tweak directly on the database (I really encourage you to avoid it)

You can install Docker using the [official download site and instructions](https://docs.docker.com/engine/install/)

### Accessing docker as user on linux

If running on linux it is wise to add your user to the docker group, so you will be able to issue the commands without going to root:

```bash
adduser username docker
```

You may need to logoff and logon again before proceeding. Just close the terminal window do not work - you need to do a complete logoff from the desktop environment.

## Install NodeJS

To develop on ticketz you need to have NodeJS 20 available, If you do not have it already you can get it on [NodeJS official download site](https://nodejs.org/en/download/prebuilt-binaries)

After installing it, you can check if you have node and npm available issuing the following commands on a terminal:

```bash
node -v

npm -v
```

## Download the repository

You need to clone this repository on your computer before any further steps:

```bash
git clone https://github.com/ticketz-oss/ticketz
```

Any following command will need to be issued inside the cloned directory, unless specified diferently:

```bash
cd ticketz
```

## Run postgres and redis from Docker

Ticketz provide a docker compose configuration to run `postgres` and `redis`, launch it using:

```bash
docker compose -f docker-compose-dev.yaml up -d
```

After a few seconds you will have:

* Postgres running on port 5432 of localhost. It will automatically create an user and a database both of them with the name `ticketz`. User `ticketz` will accept anything as password.
* Redis running on port 6379 of localhost.
* PgAdmin4 running on https://localhost:8081 - Username is `admin@ticketz.host` and password is `123456`. It will already have a server connection setted up, when asked for `ticketz` user password you can answer anything

## Backend

The following commands must be issued on the `backend`, be sure to enter it before proceeding.

### Install dependencies

The following command will install the backend's dependencies

```bash
npm ci
```

### Configuration file

The default configuration example must be copied to the configuration file. It have a good set of defaults parameters.

**On Linux:**

```bash
cp .env.dev .env
```

**On windows:**

```powershell
copy .env.dev .env
```

### Initialize Database

The created database is empty, to initialize it you should issue the following commands:

```bash
npm run build

npx sequelize db:migrate

npx sequelize db:seed:all
```

### Run the backend

You can open a new terminal, navigate into the `backend` folder and launch this command:

```bash
npm run dev:server
```

You can leave this running, it will watch for file alterations and restart automatically. It will also connect to the debugger if you launch it from a configured VSCode environment.


## Frontend

Enter the `frontend` folder before the following steps.

### Install dependencies

The following command will install the frontend's dependencies

```bash
npm ci
```

### Run the frontend

```bash
npm run start
```

After a few minutes the frontend window will be opened at http://localhost:3000

You can leave the command running, it will watch for file changes and reload as needed.


## Maintenance

### Docker services

You can stop, clear the data and restart the `postgres`, `redis` and `pgadmin` docker services.

All the commands should be entered inside the base projects folder (usually `ticketz`)

#### Stop the services

```bash
docker compose -f docker-compose-dev.yaml down
```

#### Remove the data (reset)

Volume names can be different if you cloned the folder with a name different than `ticketz`

```bash
docker volume rm ticketz_postgres_data
docker volume rm ticketz_redis_data
```

#### (re)start the services

```bash
docker compose -f docker-compose-dev.yaml up -d
```

### Change configuration

By default these are the ports used on this guide:

* Postgres: 5432
* Redis: 6379
* PgAdmin: 8081
* Ticketz Backend: 8080
* Ticketz Frontend: 3000

You can change the `postgres`, `redis` and `pgadmin` ports changing the `docker-compose-dev.yaml` file

To change the Ticketz Backend port you need to edit the `.env` file and also need to create the `config-dev.json` file on `frontend/public` using the `frontend/public/config-dev-example.json`

To change the Ticketz Frontend port you need to create a `.env` file inside the `frontend` folder setting the desired port:

```bash
PORT=3001
```
