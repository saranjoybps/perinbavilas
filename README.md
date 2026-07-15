# Perinba Vilas (`pvtweb`)

Family legacy website and private member portal for the Perinba Vilas family.

| Surface | Path | Purpose |
|---------|------|---------|
| Public site | `/` | Branding, values, timeline, gallery, contact |
| Member portal | `/dashboard/*` | Profile, events, announcements, gallery, family directory |
| Admin portal | `/admin/*` | Users, gallery approval, family directory, events, announcements, requests |
| API | `/api/*` | Firestore-backed routes (Firebase Auth + Admin SDK) |

## Stack

| Layer | Tech |
|-------|------|
| App | Next.js 16 (App Router), React 19, Turbopack |
| Language | JavaScript + TypeScript (family module) |
| TypeScript | **5.x only** (`^5.9.2`) — do not use TypeScript 7; it breaks `next build` on Vercel |
| Styling | Tailwind CSS v4, GSAP, Framer Motion, Lenis |
| Auth / DB | Firebase Auth, Firestore, Firebase Admin |
| Media | Cloudinary |
| Forms | react-hook-form, Zod |
| Deploy | Vercel (`sin1`); optional Firebase deploy scripts for rules |

## Quick start

```bash
npm install
cp .env.local.example .env.local   # then fill in all vars below
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
| `npm run deploy:rules` | Deploy Firestore rules (needs Firebase CLI config) |
| `npm run deploy` | Firebase deploy |

## Environment

Copy `.env.local.example` → `.env.local`. The example file is incomplete — set all of these:

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

Mirror the same values in the Vercel project Environment Variables for production.

## Project layout

```
app/
  page.js                 # Public homepage
  login/                  # Auth pages
  dashboard/              # Member portal
  admin/                  # Admin portal
  api/                    # Route handlers
components/               # UI (sections, auth, dashboard, family, admin)
context/                  # Auth + Lenis providers
lib/                      # Client API, Firebase, email, helpers
services/family/          # Family directory server logic
types/family.ts           # Family module types
proxy.js                  # Auth redirect middleware helper
vercel.json               # Vercel build + region (sin1)
FAMILY_MODULE_LOG.md      # Family module architecture notes
```

## Architecture

- Client data goes through `lib/api.js` → `/api/*` (not direct Firestore from the browser), except Firebase Auth.
- API routes use `verifyAuth()` (`__auth_token` cookie or `Authorization: Bearer`).
- Roles: `member` | `admin` | `super_admin`.
- Two family-related Firestore collections:
  - `family_members` — portal member cards
  - `families` — hierarchical family directory (admin CRUD / PDF tooling)
- Other collections: `users`, `gallery`, `events`, `announcements`, `edit_requests`, `authentication`.

## Deploy (Vercel)

- Framework: Next.js; output directory: `.next`
- Region: Singapore (`sin1`) — configured in `vercel.json`
- Build: `npm install` → `next build`
- Branches: typically `main` for production, `dev` for previews

```bash
git push origin main   # or merge via PR from dev
```

## Notes

- Pin **TypeScript to 5.x**. TypeScript 7 removed `lib/typescript.js`, which Next.js 16.2.5 expects; Vercel builds fail silently after compile if TS 7 is installed.
- See `FAMILY_MODULE_LOG.md` for family directory migration details.
