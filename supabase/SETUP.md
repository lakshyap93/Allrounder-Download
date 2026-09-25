# Supabase temporary media setup

The private `allrounder-temp` Storage bucket is already created for this project. Its per-file limit is 50 MiB to match the Supabase Free plan.

## Apply the database migration

In the Supabase Dashboard, open **SQL Editor → New query**, paste the contents of `migrations/20260924000000_temporary_media.sql`, and run it. The table has no browser-facing RLS policies; the app accesses it only with `SUPABASE_SECRET_KEY` on the server.

## Configure the public deployment

Set these server environment variables in the hosting dashboard:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `CRON_SECRET` (use the generated value from the local `.env.local`, or generate a different random value for production)

Schedule an authenticated `GET /api/cron/cleanup` request every 5–15 minutes with the header `Authorization: Bearer <CRON_SECRET>`. Successful downloads delete their Storage object and metadata row as soon as the response finishes; the scheduled endpoint removes abandoned objects after their 30-minute expiry.

Media is processed in a short-lived OS temp directory and that directory is removed in a `finally` block after upload, including on errors. A hard process crash can leave an OS temp directory behind; production hosts should provide ephemeral scratch storage.
