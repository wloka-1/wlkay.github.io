# Baby Tracker

Private family baby log. Cloudflare Worker + D1 (SQLite) + Claude Haiku for natural-language parsing. Dashboard served by the same Worker. Entries come from an iPhone Siri Shortcut.

Supports three event types: feeds (start/end, left/right/bottle + oz), diapers (pee/poop/both), and sleep (start/end).

## Deploy

Prerequisites: a Cloudflare account, an Anthropic API key, Node 20+, and `npm`.

```sh
cd baby-tracker
npm install
npx wrangler login
```

### 1. Create the D1 database

```sh
npx wrangler d1 create baby-tracker
```

Copy the `database_id` from the output into `wrangler.toml` (replacing `REPLACE_WITH_DATABASE_ID`).

Apply the schema:

```sh
npm run db:init
```

### 2. Set secrets

Generate a shared token (32 hex bytes):

```sh
openssl rand -hex 32
```

Set the two secrets (paste values when prompted):

```sh
npx wrangler secret put SHARED_TOKEN
npx wrangler secret put ANTHROPIC_API_KEY
```

### 3. Deploy

```sh
npm run deploy
```

Wrangler prints your Worker URL, e.g. `https://baby-tracker.YOURSUB.workers.dev`. Open it to verify the dashboard loads; it will prompt for your `SHARED_TOKEN`.

Optional: bind a custom domain in the Cloudflare dashboard (Workers & Pages → your worker → Triggers → Custom Domains).

## Verify the API

```sh
# one-shot diaper log
curl -X POST "https://YOUR-WORKER-URL/log" \
  -H "X-Token: YOUR_SHARED_TOKEN" \
  -H "content-type: application/json" \
  -d '{"text":"/poop"}'

# natural language
curl -X POST "https://YOUR-WORKER-URL/log" \
  -H "X-Token: YOUR_SHARED_TOKEN" \
  -H "content-type: application/json" \
  -d '{"text":"feeding started 6 minutes ago, left side"}'

# end the open feed
curl -X POST "https://YOUR-WORKER-URL/log" \
  -H "X-Token: YOUR_SHARED_TOKEN" \
  -H "content-type: application/json" \
  -d '{"text":"done"}'
```

Each response includes a human-readable `message` the Shortcut can Siri-speak back.

## iPhone Siri Shortcut

On each parent's phone, create **one** Shortcut:

1. Open **Shortcuts** app → `+` → **New Shortcut**, name it `Log baby`.
2. Add action: **Dictate Text** (Settings: Stop Listening → On Pause, Language → English).
3. Add action: **Get Contents of URL**.
   - URL: `https://YOUR-WORKER-URL/log`
   - Method: `POST`
   - Headers:
     - `X-Token`: your `SHARED_TOKEN`
     - `Content-Type`: `application/json`
   - Request Body: **JSON** → add field `text` → set to the Dictated Text variable.
4. Add action: **Get Dictionary Value** → Key `message` → from previous URL contents.
5. Add action: **Speak Text** → input is the Dictionary Value from step 4.
6. (Optional) Add Siri phrase: "Log baby" so you can say "Hey Siri, log baby".

Pin the Shortcut to your home screen for one-tap access.

### Quick variants (optional)

Duplicate the Shortcut and replace the Dictate Text action with **Text** containing a literal command. These skip voice entirely for the most common cases:

- `Quick poop` — body `{"text":"/poop"}`
- `Quick pee` — body `{"text":"/pee"}`
- `End feed` — body `{"text":"done"}`

## Accepted inputs

The regex fast-path handles:

- `/poop`, `/pee`, `/diaper both`
- `/feed start left`, `/feed start right`, `/feed start bottle 4`
- `/feed end`, `/done`
- `/sleep start`, `/sleep end`, `/wake`

Anything else falls through to Claude Haiku, which handles free-form English like:

- `she just pooped`
- `feeding started 6 minutes ago, right`
- `4oz bottle now`
- `down for a nap`
- `done` / `wake up` (closes the most recent open event of that kind)

Relative times ("6 min ago") are resolved server-side.

## Dashboard

`https://YOUR-WORKER-URL/` — enter your shared token once; it's stored in `localStorage`. Auto-refreshes every 30s. Shows today's totals (feeds + oz, diapers, sleep), an "in progress" banner with an End button, and the last 48 hours of events. Tap the `×` on an event to delete it.

Add to Home Screen from Safari for an app-like experience.

## Cost estimate

- Cloudflare Workers + D1: free tier easily covers family-scale usage.
- Anthropic API: Haiku 4.5 parsing runs ~200 output tokens per entry. At 30 entries/day that's roughly \$0.03/month.

## Troubleshooting

- **Dashboard shows "unauthorized"** — token mismatch. Re-check `SHARED_TOKEN` on the Worker matches what you saved in the browser and in the Shortcut.
- **Shortcut does nothing** — long-press the Shortcut → Edit, run it step by step via the play icon; errors appear per-action.
- **Parser rejects an input** — add a test case to `src/parse.ts`'s regex pass or rephrase. The LLM fallback handles most natural phrasings.

## Scope

This is a v1 for a single baby and two parents. No multi-baby support, no grandparent access, no charts, no push notifications. Extend as needed.
