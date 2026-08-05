# Smash Rank — Badminton Social Leaderboard

A lean, Strava-inspired leaderboard app for badminton socials. Sign up with just your
name + email, join a community, and watch live rankings update as the host logs matches.

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Supabase** — Postgres database, passwordless email auth, and Realtime
- **Tailwind CSS** — dark, bold, sporty styling (no component library dependency)

## What's included (v1 scope)

- Quick sign-up: email magic link + name, phone (optional), community
- Simple profile page (name, community, contact info)
- Host flow: create an event (name + date)
- Host-only match logging: two players, a score, a winner
- **Live leaderboard** per event — ranks players by points, updates in real time via
  Supabase Realtime as matches are logged (no refresh needed)

Nothing else is in scope for v1 by design — no tournaments, brackets, chat, or admin panel.

## Backend (already provisioned)

A Supabase project has been created for you:

- Project: `badminton-leaderboard` (ref `gijnjivzxqqbyomcvcpo`)
- Dashboard: https://supabase.com/dashboard/project/gijnjivzxqqbyomcvcpo
- Schema, RLS policies, and Realtime are already applied (see "Database design" below).
- `.env.local` in this folder already has the project URL + public anon key wired up.

## Run it locally

This sandbox couldn't reach the npm registry to install packages or run a build, so you'll
need to do that step on your own machine (with internet access):

```bash
cd badminton-leaderboard
npm install
npm run dev
```

Then open http://localhost:3000.

### Auth redirect URL

Supabase needs to know it's allowed to redirect back to your app after a magic-link
click. In the [Auth URL Configuration](https://supabase.com/dashboard/project/gijnjivzxqqbyomcvcpo/auth/url-configuration)
page, make sure these are present:

- Site URL: `http://localhost:3000` (already the default)
- Redirect URLs: add `http://localhost:3000/**` for local dev, and your production URL
  (e.g. `https://yourapp.vercel.app/**`) once you deploy.

## How sign-up works

1. User enters their email on the landing page → Supabase sends a magic link (no password).
2. Clicking the link hits `/auth/callback`, which exchanges the code for a session.
3. First-time users land on `/complete-profile` to add their name, phone (optional), and
   pick or create a community. This is the only "form" in onboarding.
4. Returning users skip straight to `/events`.

Phone number is collected and shown on the profile, but sign-in itself is email-only for
this v1 (real SMS OTP requires a paid Twilio-style provider connected to Supabase — easy
to add later in Authentication → Providers → Phone if you want it).

## How the leaderboard works

- Matches are logged by the event host only (`player1`, `player2`, their scores, winner
  auto-derived from the higher score).
- A Postgres view, `event_leaderboard`, aggregates matches per event: **3 points for a
  win, 1 for a loss** (so showing up always counts), with wins/losses and point
  differential as tiebreakers.
- The event page subscribes to Postgres changes on the `matches` table for that event via
  Supabase Realtime. Any insert/update/delete re-fetches the leaderboard view and match
  list instantly for everyone viewing the page — no polling, no refresh button.

Want a different points formula (e.g. win=2/loss=0, or count games rather than matches)?
It's a one-line change to the `event_leaderboard` view in Supabase SQL editor.

## Database design

| Table | Purpose |
|---|---|
| `communities` | Named groups (e.g. "Downtown Smashers"). Created on the fly at sign-up. |
| `profiles` | 1:1 with `auth.users`. Name, phone, email, community. |
| `events` | A social, with a name, date, and host (`host_id`). |
| `matches` | One logged game: two players, their scores, the winner, which event. |
| `event_leaderboard` (view) | Aggregates `matches` into ranked, per-event standings. |

Row Level Security: everyone (including anonymous visitors, if you share a link) can
**read** profiles/events/matches/leaderboards. Only the signed-in owner can write their
own profile, and only an event's host can create/edit/delete that event's matches.

## Project structure

```
src/
  app/                  routes (App Router)
    page.tsx             landing / sign-in
    auth/callback/       magic-link session exchange
    complete-profile/    one-time onboarding form
    profile/             read-only profile
    events/               list + create events
    events/[id]/          event detail: live leaderboard + match logging
  components/            UI + feature components
  lib/supabase/          browser/server/middleware Supabase clients
  lib/types.ts           hand-written row types (regenerate via Supabase CLI if the schema changes)
```

## Deploying

Any Next.js host works (Vercel is the path of least resistance). Set the two env vars
from `.env.local` in your host's dashboard, add the production URL to Supabase's redirect
URLs, and deploy.
