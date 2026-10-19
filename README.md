[![en](https://img.shields.io/badge/lang-en-green.svg)](README.md)
[![pt-br](https://img.shields.io/badge/lang-pt--br-red.svg)](README.pt.md)

# Ticketz

Ticketz is a communicator with CRM and helpdesk features that uses WhatsApp as a means of communication with clients.

---

## ⚡ Quick Start — Run Locally (Docker)

**Goal: clone on any machine and have it running with a single command.**

Everything you need is already committed in the repository, including the local
configuration files (`.env-backend-local` and `.env-frontend-local`). You do
**not** need to create or edit any config to run it locally.

### Requirements

- [Docker](https://docs.docker.com/engine/install/) with the Compose plugin (`docker compose`)
- Git

### Steps

```bash
# 1. Clone
git clone https://github.com/GuiZeroUm/ticketz.git
cd ticketz

# 2. Start everything (backend, frontend, Postgres, Redis)
docker compose -f docker-compose-local.yaml up -d --build
```

The first run builds the images and initializes the database, so it takes a few
minutes. When it finishes, open:

| What | Value |
|------|-------|
| App URL | http://localhost:3000/login |
| Login | `admin@ticketz.host` |
| Password | `123456` |

That's it. 🎉

### Everyday commands

```bash
# See running containers
docker compose -f docker-compose-local.yaml ps

# Follow the backend logs (wait for "server started")
docker compose -f docker-compose-local.yaml logs -f backend

# Stop (keeps database and uploaded files)
docker compose -f docker-compose-local.yaml down

# Stop and wipe everything (database, Redis, uploads)
docker compose -f docker-compose-local.yaml down -v
```

<details>
<summary><b>Troubleshooting & options</b> (port conflicts, faster startup, LAN access)</summary>

#### How it fits together

- There is **no root `package.json`** — backend and frontend are separate packages, orchestrated by Docker Compose.
- The frontend runs on port `3000` and talks to the backend through `http://localhost:3000/backend`.
- The backend is also published directly on port `8080` (only needed for direct access/debugging).

#### Port 8080 already in use

Publish the backend on another port. The app still opens on `http://localhost:3000/login`.

```bash
BACKEND_PORT=18080 docker compose -f docker-compose-local.yaml up -d --build
```

#### Backend image downloads too slowly

The default backend runtime image (`ghcr.io/ticketz-oss/ticketz-node-24`) can be
slow to pull in some environments. This repo ships an override that swaps it for
the official `node:24` image for local development only:

```bash
docker compose -f docker-compose-local.yaml -f docker-compose.localruntime.yaml up -d --build
```

> Add the same `-f docker-compose.localruntime.yaml` (and `BACKEND_PORT=...` if you
> used it) to the `ps`, `logs`, and `down` commands so they target the same stack.

#### Check it's healthy

```bash
curl -I http://localhost:3000/          # frontend
curl -I http://localhost:3000/backend/  # backend through the proxy
```

Both should return `200 OK` once everything is ready.

#### Run on your local network

By default the system only answers on `localhost`. To reach it from other devices
on your network, edit `.env-backend-local` and `.env-frontend-local` and change
`localhost` to your machine's IP (e.g. `192.168.0.10`), then restart.

</details>

---

## About the Project

### Original Authorship

This project was initiated in [an Open Source project](https://github.com/canove/whaticket-community), published by the developer [Cassio Santos](https://github.com/canove) under the permissive MIT license. It later received various improvements by unidentified authors and was commercially distributed directly between developers and users with the provision of source code. According to information from [this video, it was leaked and publicly released at some point](https://www.youtube.com/watch?v=SX_cGD5RLkQ).

After some research, it was further identified that the first SaaS version of Whaticket was created by the developer [Wender Teixeira](https://github.com/w3nder), including a version of [Whaticket Single](https://github.com/unkbot/whaticket-free) that uses the Baileys library for WhatsApp access.

It is practically impossible to identify and credit the authors of the improvements. [The code published by the Vem Fazer channel](https://github.com/vemfazer/whaticket-versao-03-12-canal-vem-fazer) does not mention any license; therefore, I am assuming that all authors are comfortable with keeping these changes under the same license as the original project (MIT).

### Relicensing

As I am making these changes and providing them at no cost, I want them to be available to everyone. Therefore, I am choosing to relicense under the AGPL, which requires that every user who has access to the system can obtain the source code.

Therefore, if you directly utilize this version, it is **very important to keep the link on the "About Ticketz" screen, which provides access to the repository**. If you wish, you can move the link to the source code elsewhere, but it must be easily accessible to any system user.

If you make changes to the code, you must change the link to a repository or another way to obtain the code for your changes.

If you wish to use parts of the code to fix any code **for your own use**, feel free to do so and you don't need to worry about the AGPL license. However, if you want to use any part added in this project in a system that you commercialize, you must either provide the code of your entire system to its users, or you must contact the author of the code to license it under different criteria.

### Objective

The objective of this project is to improve and keep open updates about the published Whaticket SaaS. Mainly focused on application quality and ease of installation and use.

The improvements developed by me will be placed here, and depending on the situation, I can transpose, always crediting, codes and improvements published in other projects also derived from Whaticket Community or Whaticket SaaS.

### Contributing Back

Whenever possible, I intend to backport some adjustments made here to the original projects.

---

## Deploy on a Public Server (Very Quick Start)

There are Docker images provided from the project, so you can get **ticketz** to work very easily on a public server (baremetal or VPS).

### First setup

Before starting you must complete this checklist:

- [ ] Have a clean server running Ubuntu 20 or newer
- [ ] Ports 80 and 443 available and not filtered by firewall
- [ ] One hostname with configured DNS pointing to your server

After this, just log in to your server and issue the following command, replacing the hostnames you already configured and your email address:

```bash
curl -sSL get.ticke.tz | sudo bash -s app.example.com name@example.com
```

After a few minutes you will have the server running at the hostname you defined.

The default login will be the email address provided in the installation command and the default password is `123456`, you must change it right away.

### Upgrade

The upgrade is just as easy as the installation. Log in to your server using the same username you used on the installation and issue the following command:

```bash
curl -sSL update.ticke.tz | sudo bash
```

Your server will go down and after some minutes it will be running the latest released version.

### Inspect logs

As all elements run in containers, logs are checked through the docker command.
Log in to your server, move to the installation folder, and read the logs:

```bash
cd ~/ticketz-docker-acme
docker compose logs -t          # full log
docker compose logs -t -f       # follow (tail)
```

---

## Deploy from Source on the Internet (custom DNS + TLS)

With a server reachable from the internet, choose two DNS names (one for the backend, one for the frontend) and an email address for certificate registration, for example:

* **backend:** api.ticketz.example.com
* **frontend:** ticketz.example.com
* **email:** ticketz@example.com

Edit `.env-backend-acme` and `.env-frontend-acme` and set these values. If you want reCAPTCHA on company signup, also add the secret and site keys to the backend and frontend files respectively.

From the project's root folder (as a user allowed to run `sudo`), start the service:

```bash
sudo docker compose -f docker-compose-acme.yaml up -d
```

On the first run, Docker compiles the code, creates the containers, and initializes the databases and tables. This can take a while, after which Ticketz is accessible at the frontend address.

The default username is the email address in `.env-backend-acme` and the default password is `123456`. The application restarts automatically after each server reboot.

To stop the service:

```bash
sudo docker compose -f docker-compose-acme.yaml down
```

---

## Important Notice

This project is not affiliated with Meta, WhatsApp, or any other company. The use of the provided code is the sole responsibility of the users and does not imply any liability for the author or project collaborators.

## Made Your Life Easier?

If this project has helped you with a complex task, consider making a donation to the author via PayPal or Brazilian PIX below.

[![](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=X6XHVCPMRQEL4)

![image](https://github.com/ticketz-oss/ticketz/assets/6070736/8e85b263-73ca-4fb4-9bdc-03fff356b6ff)

PIX Key: 0699c69d-0951-4686-a5b7-c6cd21aa7e15
</content>
</invoke>
