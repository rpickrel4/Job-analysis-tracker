# Job Hunt Copilot

A personal job-hunting app: build a profile of yourself (resume + interview),
paste in job postings to get an AI fit analysis, and track every application
in one place.

Built with Next.js (App Router), SQLite via Prisma, and the Anthropic Claude
API.

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

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example env file and add your Anthropic API key (get one at
   https://console.anthropic.com/):

   ```bash
   cp .env.example .env
   # then edit .env and set ANTHROPIC_API_KEY
   ```

3. Create the local SQLite database:

   ```bash
   npx prisma migrate dev
   ```

4. Run the app:

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

All data (resume text, interview answers, synthesized profile, job analyses,
and tracked applications) is stored locally in `prisma/dev.db`, a SQLite file
that isn't committed to git. Nothing leaves your machine except the API calls
to Anthropic for analysis.

## Notes & limitations

- **Automatic job fetching is best-effort.** Sites like LinkedIn frequently
  block anonymous/server-side requests or require login, so fetching a URL
  can fail. When it does, paste the job description text into the box that
  appears and the app will still analyze it.
- **AI features require `ANTHROPIC_API_KEY`.** Without it, resume upload and
  the tracker still work, but profile synthesis and job analysis will return
  an error telling you to set the key.
- **Single-user, local-first.** There's no auth or multi-user support — the
  profile is a single row reused across the app, matching the "just for me"
  use case this was built for.

## Tech stack

- Next.js 16 (App Router, TypeScript, Tailwind CSS)
- Prisma + SQLite
- Anthropic Claude API (`@anthropic-ai/sdk`)
- `pdf-parse` / `mammoth` for resume text extraction
- `@mozilla/readability` + `jsdom` for job posting extraction from URLs
