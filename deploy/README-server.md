# Campus Match Server Deployment

This folder prepares the project for a self-hosted Ubuntu server with:

- Docker Compose for the app and MySQL
- Host-level Nginx reverse proxy
- Let's Encrypt HTTPS

## Recommended server

- Ubuntu 22.04 or 24.04
- 2 vCPU / 2 GB RAM minimum
- One public IPv4 address

## Files in this folder

- `docker-compose.server.yml`: production app + MySQL stack
- `.env.server.example`: production environment template
- `nginx/campus-match.http.conf`: first Nginx config before HTTPS is issued
- `nginx/campus-match.https.conf`: final Nginx config after Certbot succeeds
- `scripts/bootstrap-ubuntu.sh`: installs Docker, Nginx, and Certbot
- `scripts/deploy-server.sh`: builds and starts the stack
- `scripts/render-nginx-config.sh`: renders Nginx configs from `APP_DOMAIN`

## 1. Prepare DNS

Point your domain's `A` record to the server public IP.

Example:

- `campus.yourdomain.com` -> `your_server_ip`

Wait until the domain resolves to the server before running Certbot.

## 2. Prepare the server

SSH into the Ubuntu server and run:

```bash
sudo bash deploy/scripts/bootstrap-ubuntu.sh
```

If the repo is not on the server yet, copy or clone it first. A common path is:

```bash
/opt/campus-match
```

## 3. Create production env file

Copy the template:

```bash
cp deploy/.env.server.example deploy/.env.server
```

Edit the real values:

```bash
nano deploy/.env.server
```

At minimum set:

- `APP_DOMAIN`
- `MYSQL_PASSWORD`
- `MYSQL_ROOT_PASSWORD`
- `CAMPUS_ADMIN_PASSWORD`
- `QQ_SMTP_AUTH_CODE`

## 4. Start app + MySQL

Run:

```bash
bash deploy/scripts/deploy-server.sh
```

The app container binds only to `127.0.0.1:3000`, so it is not directly exposed to the public internet. Nginx will proxy requests to it.

## 5. Render and install Nginx site config

Generate the final config files from `APP_DOMAIN`:

```bash
bash deploy/scripts/render-nginx-config.sh
```

Then install the HTTP config first:

```bash
sudo cp deploy/generated/campus-match.http.conf /etc/nginx/sites-available/campus-match.conf
sudo ln -sf /etc/nginx/sites-available/campus-match.conf /etc/nginx/sites-enabled/campus-match.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 6. Issue HTTPS certificate

Run Certbot:

```bash
sudo certbot --nginx -d your-domain.com
```

When Certbot succeeds, switch to the HTTPS config:

```bash
sudo cp deploy/generated/campus-match.https.conf /etc/nginx/sites-available/campus-match.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Verify the site

Check:

- `https://your-domain.com/login`
- registration
- login
- campus card upload
- match and message flow

## 8. Routine operations

Redeploy after code updates:

```bash
bash deploy/scripts/deploy-server.sh
```

Check containers:

```bash
docker compose -f deploy/docker-compose.server.yml --env-file deploy/.env.server ps
```

View logs:

```bash
docker compose -f deploy/docker-compose.server.yml --env-file deploy/.env.server logs -f app
```

## Notes

- The server stack is independent from Netlify.
- MySQL is private inside Docker and not published to the public network by default.
- Uploads are stored in the Docker volume `campus-match-data`.
- MySQL data is stored in the Docker volume `mysql-data`.
