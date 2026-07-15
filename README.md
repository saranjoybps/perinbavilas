# Perinba Vilas (`pvtweb`)

Family legacy website and private member portal for the Perinba Vilas family.

- **Public site** (`/`) — branding, values, timeline, gallery, contact
- **Member portal** (`/dashboard/*`) — profile, events, announcements, gallery, family directory
- **Backend** — Next.js API routes over Firebase Auth + Firestore, with Cloudinary for media

## Stack

| Layer | Tech |
|-------|------|
| App | Next.js 16 (App Router), React 19, Turbopack |
| Language | JavaScript + TypeScript (family module) |
| Styling | Tailwind CSS v4, GSAP, Framer Motion, Lenis |
| Auth / DB | Firebase Auth, Firestore, Firebase Admin |
| Media | Cloudinary |
| Deploy | Vercel (`sin1`), Firebase deploy scripts for rules |

## Quick start

```bash
npm install
cp .env.local.example .env.local   # then fill in real values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run lint` | Next.js ESLint |
| `npm run deploy:rules` | Deploy Firestore rules |
| `npm run deploy` | Firebase deploy |

## Environment

Copy `.env.local.example` → `.env.local`. Required variables used by the app:

```env
NEXT_PUBLIC_SITE_URL=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

GMAIL_USER=
GMAIL_PASSWORD=

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

ADMIN_CLOUDINARY_CLOUD_NAME=
ADMIN_CLOUDINARY_API_KEY=
ADMIN_CLOUDINARY_API_SECRET=
```

Set the same values in the Vercel project settings for production.

## Project layout

```
app/                  # App Router pages + API routes
  page.js             # Public homepage
  dashboard/          # Authenticated member portal
  api/                # Firestore-backed API (users, families, gallery, …)
components/           # UI (sections, auth, dashboard, family)
context/              # Auth + Lenis providers
lib/                  # Client API, Firebase, email, helpers
services/family/      # Family directory server logic (Firestore, images, PDF)
types/family.ts       # Family module types
FAMILY_MODULE_LOG.md  # Family module architecture notes
vercel.json           # Vercel build + region config
```

## Architecture notes

- Client data access goes through `lib/api.js` → `/api/*` (not direct Firestore from the browser), except Firebase Auth.
- API routes authenticate with `verifyAuth()` (`__auth_token` cookie or `Authorization: Bearer`).
- Roles: `member` | `admin` | `super_admin`.
- Two family-related Firestore collections:
  - `family_members` — portal member cards
  - `families` — hierarchical family directory / PDF

## Deploy (Vercel)

Configured as a Next.js app. Build output is `.next` (see `vercel.json`). Region: Singapore (`sin1`).

```bash
# Push to your connected branch; Vercel builds with:
# install: npm install
# build:   next build
```

## Docs

See `FAMILY_MODULE_LOG.md` for the family directory migration and known gaps.
