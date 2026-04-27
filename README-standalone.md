# Campus Match Standalone

## Native local run

1. Copy `.env.example` to `.env.local`.
2. Fill in at least `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, and `MYSQL_PASSWORD`.
3. Start the app:

```powershell
npm install
npm run standalone
```

Open [http://127.0.0.1:3000/login](http://127.0.0.1:3000/login).

## Docker Compose run

Install Docker Desktop first.

1. Copy `.env.example` to `.env`.
2. Set at least `MYSQL_ROOT_PASSWORD`.
3. Start the stack:

```powershell
docker compose up -d --build
```

After startup:

- App: [http://127.0.0.1:3000/login](http://127.0.0.1:3000/login)
- MySQL: `127.0.0.1:3307`

The Docker stack uses:

- MySQL database name: `campus_match`
- MySQL user: `root`
- MySQL password: `MYSQL_ROOT_PASSWORD`

Docker Compose reads these values from the root `.env` file or your current shell environment.

## Mail behavior

By default the local stack keeps `EMAIL_VERIFICATION_DEBUG=true`, so registration can still work even when SMTP is not configured.

To send real QQ mail in standalone mode, set:

- `EMAIL_VERIFICATION_DEBUG=false`
- `QQ_SMTP_USER=your@qq.com`
- `QQ_SMTP_AUTH_CODE=your-smtp-auth-code`
- `SMTP_HOST=smtp.qq.com`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_FROM=Campus Match <your@qq.com>`

## Persistent data

- Uploaded campus card images: `local-data/blob-store/uploads`
- Native local MySQL: your own local MySQL instance
- Docker MySQL data: Docker volume `mysql-data`

## Notes

- The Docker stack does not depend on Netlify Functions runtime.
- Production Netlify deployment still uses the existing online backend until you migrate it to your own server or cloud database.
- For Ubuntu cloud deployment, see `deploy/README-server.md`.
