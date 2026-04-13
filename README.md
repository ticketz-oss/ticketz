[![en](https://img.shields.io/badge/lang-en-green.svg)](README.md)
[![pt-br](https://img.shields.io/badge/lang-pt--br-red.svg)](README.pt.md)

# ERPCon

**ERPCon - Sistema de atendimento via WhatsApp com recursos de CRM e helpdesk**

ERPCon is a customer service system that uses WhatsApp as the primary communication channel, featuring CRM and helpdesk capabilities to help teams manage conversations, contacts, and support queues efficiently.

## Original Authorship

This project was initiated in [an Open Source project](https://github.com/canove/whaticket-community), published by the developer [Cassio Santos](https://github.com/canove) under the permissive MIT license. It later received various improvements by unidentified authors and was commercially distributed directly between developers and users with the provision of source code. According to information from [this video, it was leaked and publicly released at some point](https://www.youtube.com/watch?v=SX_cGD5RLkQ).

After some research, it was further identified that the first SaaS version of Whaticket was created by the developer [Wender Teixeira](https://github.com/w3nder), including a version of [Whaticket Single](https://github.com/unkbot/whaticket-free) that uses the Baileys library for WhatsApp access.

It is practically impossible to identify and credit all authors of the improvements. [The code published by the Vem Fazer channel](https://github.com/vemfazer/whaticket-versao-03-12-canal-vem-fazer) does not mention any license; therefore, we assume that all authors are comfortable with keeping these changes under the same license as the original project (MIT).

This project also builds upon [Ticketz](https://github.com/ticketz-oss/ticketz), developed by the open-source community, whose work we gratefully acknowledge.

## License

This project is licensed under the **AGPL-3.0**. Any user with access to the running system must be able to obtain the source code.

Therefore, if you deploy this version, it is **very important to keep the link on the "About ERPCon" screen**, which provides access to the repository. If you wish, you can move the source code link elsewhere, but it must be easily accessible to any system user.

If you make changes to the code, you must update the link to point to a repository containing your modifications.

## Objective

The objective of this project is to improve and maintain an open, up-to-date customer service platform based on WhatsApp, focused on application quality and ease of installation and use.

Running from Source Code Using Docker
--------------------------------------

You need Docker Community Edition and the Git client installed. [The official Docker installation guide can be found here](https://docs.docker.com/engine/install/).

Clone the repository and enter the project folder:

```bash
git clone https://github.com/erpsg/ERPCONticketz.git
cd ERPCONticketz
```

## Running Locally

By default, the configuration is set to run the system only on the local computer. To run it on a local network, edit the `.env-backend-local` and `.env-frontend-local` files and change the backend and frontend addresses from `localhost` to the desired IP address (e.g., `192.168.0.10`).

To start the system, run:

```bash
docker compose -f docker-compose-local.yaml up -d
```

On the first run, the system will initialize the databases and tables. After a few minutes, ERPCon will be accessible on port 3000.

The default username is `admin@erpcon.host` and the default password is `123456`. Change it immediately after the first login.

The application restarts automatically after each server reboot.

To stop the application:

```bash
docker compose -f docker-compose-local.yaml down
```

## Running and Serving on the Internet

For a server accessible via the internet, configure two DNS names — one for the backend and one for the frontend — and an email address for certificate registration. For example:

* **backend:** api.erpcon.example.com
* **frontend:** erpcon.example.com
* **email:** admin@example.com

Edit the `.env-backend-acme` and `.env-frontend-acme` files with these values.

If you want to use reCAPTCHA on the company signup page, also insert the secret and site keys in the respective backend and frontend files.

From the project root folder, start the service with:

```bash
sudo docker compose -f docker-compose-acme.yaml up -d
```

On the first run, Docker will build the images and create the containers. ERPCon will then initialize the databases and tables — this may take a few minutes, after which ERPCon will be accessible at the frontend address you configured.

The default username is the email address set in `.env-backend-acme` and the default password is `123456`.

The application restarts automatically after each server reboot.

To stop the service:

```bash
sudo docker compose -f docker-compose-acme.yaml down
```

## Inspecting Logs

All components run in containers. To inspect logs, move to the project folder and run:

```bash
docker compose logs -t
```

To follow logs in real time:

```bash
docker compose logs -t -f
```

## Important Notice

This project is not affiliated with Meta, WhatsApp, or any other company. The use of the provided code is the sole responsibility of the users and does not imply any liability for the authors or project collaborators.
