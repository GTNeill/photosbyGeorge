# Railway Environment Variables

Set these in the Railway dashboard under **Variables** for your service.

## Required

| Variable | Description |
|---|---|
| `NODE_ENV` | Set to `production` |
| `PORT` | Railway sets this automatically — leave unset or set to `3000` |
| `DATABASE_URL` | Turso database URL (`libsql://...`) |
| `DATABASE_AUTH_TOKEN` | Turso auth token |
| `S3_ENDPOINT` | Tigris S3-compatible endpoint URL |
| `S3_BUCKET` | Tigris bucket name |
| `S3_ACCESS_KEY_ID` | Tigris access key |
| `S3_SECRET_ACCESS_KEY` | Tigris secret key |
| `BETTER_AUTH_SECRET` | Random secret for session signing (32+ chars) |
| `WEBSITE_URL` | Your Railway public URL, e.g. `https://photos-by-george.up.railway.app` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `ADMIN_EMAILS` | Comma-separated admin email(s), e.g. `george@gneill.net` |
| `DRIVE_INGEST_TOKEN` | Secret token for Drive import webhook |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full service account JSON (single line, no quotes) |

## Optional

| Variable | Description |
|---|---|
| `DRIVE_FOLDER_ID` | Google Drive folder ID for photo imports |
| `GOOGLE_DRIVE_API_KEY` | Legacy — replaced by service account, keep if used elsewhere |
| `AI_GATEWAY_BASE_URL` | Runable AI gateway base URL |
| `AI_GATEWAY_API_KEY` | Runable AI gateway key |
| `AUTUMN_SECRET_KEY` | Autumn payments key (if payments enabled) |
| `RUNABLE_AUTH_ISSUER` | Runable auth issuer (Runable-specific) |
| `RUNABLE_AUTH_CLIENT_ID` | Runable auth client ID |
| `RUNABLE_AUTH_CLIENT_SECRET` | Runable auth client secret |
| `APPLICATION_ID` | Runable application ID |
| `RUNABLE_URL` | Runable platform URL |

## Google OAuth — Update Redirect URI

After deploying, add this to your Google OAuth app's **Authorized redirect URIs**:

```
https://<your-railway-domain>/api/auth/callback/google
```

## Notes

- `GOOGLE_SERVICE_ACCOUNT_JSON` must be a single-line JSON string (no newlines). 
  Paste the contents of your service account `.json` file as-is.
- `WEBSITE_URL` must match exactly what Railway assigns — used for auth callbacks.
