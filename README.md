# Job Tracker

A local-first job application tracker. Keep every posting, status, and tailored resume in one place on your machine—no account, no cloud, no spreadsheet.

## Overview

Applying to jobs usually means a pile of bookmarks, a few differently named PDFs, and a mental map of who you have heard back from. Job Tracker is a small desktop web app for that workflow:

- Log a role with the posting link and where you are in the process
- Attach the resume you tailored for that job, or reuse one you already stored
- Filter by status and date when the list grows
- See follow-ups that are due or overdue on the dashboard

All data stays in a SQLite database inside this project. Identical resume files are stored once (SHA-256), so you do not accumulate duplicate copies.

## Features

- **Applications** — title, company, posting URL, location, work mode, source, salary notes, applied date, follow-up date, and free-form notes
- **Status pipeline** — Interested, Applied, Screening, Interviewing, Offer, Accepted, plus Rejected, Withdrawn, and Ghosted
- **Status history** — every change is appended to a timeline; history is never overwritten
- **Resume library** — upload a file, give it a label, and attach it to one or many jobs. The same bytes are stored once
- **Filters** — search company/title/location, multi-select status, and date range
- **Dashboard** — counts by status and a follow-up list (overdue, due today, upcoming)
- **Local data safety** — SQLite WAL mode, foreign keys, transactions, startup integrity check, and rotating backups

## Tech stack

| Piece | Choice | Why |
| --- | --- | --- |
| UI | Next.js (App Router), React, TypeScript, Tailwind CSS | One local process, typed UI, straightforward to run |
| Database | SQLite via `better-sqlite3` + Drizzle ORM | File-backed, transactional, no server to operate |
| Files | Content-addressed resumes under `data/files/` | Dedup by hash; applications point at a resume id |

This is intentionally a **local app**. Run it on your laptop and open it in the browser. Nothing is sent to a hosted service.

## Screenshots

Add captures after your first run (see [docs/screenshots/README.md](docs/screenshots/README.md)):

![Dashboard](docs/screenshots/dashboard.png)

![Applications](docs/screenshots/applications.png)

![Application detail](docs/screenshots/detail.png)

## Requirements

- **Node.js 18+** (Node 20 or 24 is fine)
- **npm** (ships with Node)

No Docker, no database install. SQLite is a file.

## Usage

### 1. Get the project

```bash
git clone <your-repo-url> job-tracker
cd job-tracker
```

If you already have the folder:

```bash
cd job-tracker
```

### 2. Install dependencies

```bash
npm install
```

If `better-sqlite3` fails to install, you need a local compiler toolchain (Xcode Command Line Tools on macOS: `xcode-select --install`), then run `npm rebuild better-sqlite3`.

### 3. Start the app

Development (auto-reload):

```bash
npm run dev
```

Production-style local run:

```bash
npm run build
npm start
```

### 4. Open it

In your browser go to:

[http://localhost:3000](http://localhost:3000)

Leave the terminal open while you use the app. Stop it with `Ctrl+C`.

### 5. Day-to-day workflow

1. Click **Add application** (sidebar or dashboard).
2. Fill in **job title** and **company** (required). Paste the **application link** so you can reopen the posting later.
3. Set **status**. `Interested` is the default. Changing to `Applied` (or later) fills in today’s date if you have not set one.
4. Optionally set a **follow-up** date. Overdue items show on the dashboard.
5. Attach a resume:
   - **Upload new** for a tailored PDF (add a short label such as `Acme SWE 2026`)
   - **Choose existing** to reuse a file from the library
6. Save. The detail page has the posting link, the resume (open or download), notes, and a **status history**.
7. On **Applications**, use search, status pills, and the date range to find things. The sidebar status list jumps to a pre-filtered view.
8. On **Resumes**, upload or rename files and see which jobs use them. A resume that is still attached to an application cannot be deleted.

Removed applications are hidden from the UI (soft delete). The row remains in SQLite so an accidental remove is recoverable from the database.

## Where your data lives

Everything is under the `data/` folder in this project (gitignored):

| Path | Contents |
| --- | --- |
| `data/job-tracker.db` | Applications, resume metadata, status events |
| `data/files/` | Resume files named by SHA-256 |
| `data/backups/` | Timestamped SQLite copies (last 10 kept) |

To back up, quit the app and copy the whole `data/` directory somewhere safe (another disk, encrypted archive, etc.). To restore, replace `data/` with that copy and start the app again.

## Data safety

Writes use SQLite **WAL** journaling, **foreign keys**, and **transactions** so a crash cannot leave a half-saved application. Resume files are written to a temp path and renamed into place. On startup the app runs `PRAGMA integrity_check` and takes a `VACUUM INTO` backup. If the integrity check fails, **writes are blocked** and a banner tells you to restore from `data/backups/` instead of mutating a damaged file.

## Project layout

```
src/app/            Pages (dashboard, applications, resumes) and API routes
src/app/api/        REST endpoints for applications, resumes, and stats
src/components/     UI: sidebar, filters, forms, status badges
src/db/             SQLite client, Drizzle schema, queries
src/lib/            Status constants, dates, shared types
data/               Local database, files, and backups (not committed)
```

Useful entry points:

- [`src/db/schema.ts`](src/db/schema.ts) — tables
- [`src/db/client.ts`](src/db/client.ts) — pragmas, integrity check, backups
- [`src/app/page.tsx`](src/app/page.tsx) — dashboard
- [`src/app/applications/page.tsx`](src/app/applications/page.tsx) — list and filters

## License

MIT. See [LICENSE](LICENSE).
