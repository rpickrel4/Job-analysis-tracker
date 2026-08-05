# Job Hunt Copilot

A personal job-hunting app: build a profile of yourself (resume + interview),
paste in job postings to get an AI fit analysis, and track every application
in one place.

Built with Next.js (App Router), a hosted Postgres database via Prisma, and
the Anthropic Claude API.

## Features

- **My Profile** — upload your resume (PDF/DOCX/TXT) and answer a guided
  interview about your work history, side businesses, goals, skills, and
  preferences. Click "Build profile" to have Claude synthesize it all into a
  structured candidate profile that's reused for every job analysis.
- **Analyze a Posting** — paste a job posting URL (LinkedIn or anywhere else).
  The app tries to fetch and extract the posting text automatically; many
  sites (LinkedIn especially) block this, so you can always paste the
  description text in directly instead. You get back company/role details, a
  standalone summary (so it's still useful after the link expires/rots), and
  a fit analysis (score, strengths, gaps, red flags, questions to ask)
  grounded in your profile. One click ("Mark as Applied") saves it to your
  tracker.
- **Application Tracker** — a table of everything you've applied to: company,
  position, industry, compensation, date applied, status, posting link, and
  summary. Add entries manually for applications made outside the app, edit
  status inline, and drill into details.

## Deploying this app as a website (no coding required)

This is written for someone with no developer background. You'll end up with
a normal web address you can open from Safari on your iPhone (or any
browser), no terminal or commands involved.

You need two free accounts: **Neon** (hosts your data) and **Vercel** (hosts
the website itself).

### Step 1 — Create a free database (Neon)

1. Go to **neon.tech** and sign up (choose "Continue with GitHub" and use the
   same GitHub account this repo lives under).
2. Create a new project (any name is fine, e.g. "job-tracker"). Keep the
   default settings.
3. On the project dashboard, find the **Connection string** — it starts with
   `postgresql://`. Copy the whole thing (e.g. into your Notes app) — you'll
   paste it into Vercel in a moment.

### Step 2 — Get an Anthropic API key

1. Go to **console.anthropic.com** and sign up / log in.
2. Go to **Settings → API Keys → Create Key**.
3. Copy the key (starts with `sk-ant-...`). This is what lets the app call
   Claude to analyze postings and build your profile. Anthropic bills this
   key by usage — for personal use (a handful of analyses a day), the cost
   is normally a few dollars a month at most.

### Step 3 — Deploy the website (Vercel)

1. Go to **vercel.com** and sign up / log in with "Continue with GitHub"
   (same GitHub account again).
2. Click **Add New… → Project**.
3. Find `Job-analysis-tracker` in the list and click **Import**. (If you
   don't see it, click "Adjust GitHub App Permissions" and grant Vercel
   access to it.)
4. Before clicking Deploy, open the **Environment Variables** section and
   add two entries:
   - Name `DATABASE_URL`, Value: the connection string you copied from Neon
   - Name `ANTHROPIC_API_KEY`, Value: the key you copied from Anthropic
5. Click **Deploy** and wait a minute or two.
6. Once it says "Ready", click **Visit** — that's your app's permanent web
   address.
7. **Important:** this project's code lives on a branch called
   `claude/job-hunting-app-3rdjm6`, not the default branch. In your Vercel
   project, go to **Settings → Git**, and set **Production Branch** to
   `claude/job-hunting-app-3rdjm6`, then trigger a redeploy (Deployments tab
   → "..." menu on the latest one → Redeploy). Otherwise Vercel will try to
   deploy an empty project.

### Step 4 — Put it on your iPhone home screen (optional)

Open the web address in Safari, tap the **Share** button, then **Add to
Home Screen**. It'll now open full-screen like a regular app.

That's it — no further setup needed. Every time you (or I, on your behalf)
push new code to that branch, Vercel automatically redeploys the updated
site.

## Notes & limitations

- **Automatic job fetching is best-effort.** Sites like LinkedIn frequently
  block anonymous/server-side requests or require login, so fetching a URL
  can fail. When it does, paste the job description text into the box that
  appears and the app will still analyze it.
- **AI features require `ANTHROPIC_API_KEY`.** Without it, resume upload and
  the tracker still work, but profile synthesis and job analysis will return
  an error telling you to set the key.
- **Single-user.** There's no login/account system — the profile is a single
  row reused across the app, matching the "just for me" use case this was
  built for. Anyone with the web address could use it, so don't share the
  link publicly.

## Tech stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS)
- Prisma + PostgreSQL (Neon)
- Anthropic Claude API (`@anthropic-ai/sdk`)
- `pdf-parse` / `mammoth` for resume text extraction
- `@mozilla/readability` + `jsdom` for job posting extraction from URLs

## Advanced: running it locally instead

If you do have a computer set up for development and prefer running it
locally rather than deploying it:

```bash
npm install
cp .env.example .env   # then fill in DATABASE_URL and ANTHROPIC_API_KEY
npx prisma migrate deploy
npm run dev
```

Open http://localhost:3000. You'll still need a Postgres database (e.g. a
free Neon project as above, or a local Postgres install) — SQLite is no
longer used, since a hosted database is required for the deployed version to
work.
