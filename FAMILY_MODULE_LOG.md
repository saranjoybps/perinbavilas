# Family Module — Migration & Redesign Log

## Summary

Migrated the complete Family Management Module from the standalone `/admin` Next.js app into the root application at `/admin/family`, then redesigned all UI to match the existing admin design language.

---

## 1. Project Setup & Configuration

### Environment
- Added `ADMIN_CLOUDINARY_*` env vars to `.env.local` (admin uses different Cloudinary account)
- Created `tsconfig.json` with `allowJs: true`, `@/*` path alias, `admin/` excluded
- Added `typescript.ignoreBuildErrors: true` to `next.config.mjs` (build worker crash workaround)
- Added `serverActions.bodySizeLimit: "10mb"` to `next.config.mjs`

### Packages Installed
`typescript`, `@types/node`, `@types/react`, `@types/react-dom`, `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `react-hook-form`, `@hookform/resolvers`, `zod`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `sonner`, `next-themes`, `lucide-react`, `pdf-lib`, `sharp@0.34.5`, `tw-animate-css`, `uuid`, `@types/uuid`

### Static Assets
- Copied `admin/public/pdf-assets/` → `public/pdf-assets/`

---

## 2. Backend Services & API

### Files Created
| File | Purpose |
|---|---|
| `services/family/firestore-service.ts` | All CRUD operations, caching, duplicate, undo, export, reload, child suggestions. Uses `adminDb` from `@/lib/firebase/admin` |
| `services/family/image-service.ts` | Cloudinary upload/delete/validate. Uses `ADMIN_CLOUDINARY_*` env vars |
| `services/family/pdf-service.ts` | PDF generation with decorative borders, photo layouts, children tables |
| `app/api/families/route.ts` | GET (list) and POST (create) API routes |
| `app/api/families/[code]/route.ts` | GET, PUT, DELETE for individual records |

### Key Design Decisions
- Firestore collection: `families` (NOT `family_members`)
- Root app uses `lib/firebase/admin.js` for Firebase Admin (env vars); admin used `service-account.json`
- Adapted all services to use root's `adminDb` import

---

## 3. Types & Utilities

| File | Purpose |
|---|---|
| `types/family.ts` | All TypeScript interfaces: `Child`, `Spouse`, `FamilyMember`, `FamilyRecord`, `DashboardStats`, `SortField`, `SortOrder`, `FilterOptions` |
| `lib/family-utils.ts` | `cn()` utility (to avoid conflict with existing `lib/utils.js`) |
| `hooks/family/use-families.ts` | Data loading, filtering, sorting, pagination, stats |

---

## 4. UI Components (Initial — shadcn-style, later replaced)

All 14 shadcn UI components were created in `components/ui-family/`:
`badge`, `button`, `card`, `dialog`, `form`, `input`, `label`, `select`, `separator`, `slot`, `sonner`, `table`, `tabs`, `textarea`

> These are no longer used by the family module after the redesign, but remain in the codebase.

---

## 5. UI Redesign (Current State)

All family module components were rewritten from shadcn/Tailwind to inline styles matching the admin design language.

### Design Language Applied

| Element | Pattern |
|---|---|
| **Card wrapper** | `className="glass-warm shadow-cloud"` |
| **Page title** | `var(--font-cormorant)`, `fontWeight: 300`, `color: '#1A1008'` |
| **Section label** | `var(--font-inter)`, `0.68rem`, `0.4em` letter-spacing, uppercase, `rgba(196,155,26,0.65)` |
| **Divider** | `<span className="gold-rule block mt-3" />` |
| **Inputs** | `rgba(255,255,255,0.72)` bg, `rgba(212,175,55,0.22)` border, focus glow |
| **Labels** | `0.62rem`, `0.24em` letter-spacing, uppercase, `rgba(26,16,8,0.42)` |
| **Buttons** | Gold outline, `onMouseEnter`/`onMouseLeave` hover-fill, danger red variant |
| **Tables** | Inline `<table>`, `rgba(212,175,55,0.08)` row borders, hover rows |
| **Modals** | Fixed overlay, `glass-warm shadow-cloud`, `rgba(26,16,8,0.35)` backdrop blur |
| **Tabs** | Inline buttons, gold underline indicator |
| **Badges** | Gold-tinted code badges |
| **Upload zone** | Dashed gold border, hover fill |
| **Loading** | Spinner: `borderTopColor: '#C49B1A'`, `animation: 'spin 1s linear infinite'` |

### Components Redesigned

| File | What it does |
|---|---|
| `app/admin/family/page.js` | Main page: header, stats, search, filters, table, pagination, modals |
| `components/family-dashboard/stats-cards.tsx` | 4 stat cards with Unicode icons |
| `components/family-dashboard/search-bar.tsx` | Inline-styled search input |
| `components/family-dashboard/filters.tsx` | Inline selects for photos/spouse/children/sort |
| `components/family-dashboard/family-table.tsx` | Sortable data table with view/edit actions |
| `components/family-dashboard/pagination.tsx` | Previous/Next buttons |
| `components/family/family-editor.tsx` | Create/edit modal with tabs (basic, spouse, children, photos) |
| `components/family/family-view-dialog.tsx` | Read-only view modal |
| `components/family/children-editor.tsx` | Drag-and-drop children table |
| `components/family/photo-upload.tsx` | Photo upload with drag-drop, deferred to submit |
| `components/family/pdf-preview.tsx` | PDF preview/download/print modal |

---

## 6. Bug Fixes

### Fixed During Migration
1. **FormField component** (`components/ui-family/form.tsx`): Changed `...props` rest params to `{ ...props }` destructuring
2. **Zod v4 type inference**: `dob` in children array inferred as optional. Fixed by adding `?. map(c => ({ ...c, dob: c.dob ?? null }))` at call sites
3. **`register` not destructured**: Added `register` to destructuring in `family-editor.tsx`
4. **sharp version mismatch**: Aligned to `sharp@0.34.5` (was `0.35.3` native with `0.34.5` JS)
5. **DndContext in tbody**: Moved `DndContext` outside `<table>` to avoid invalid HTML (`<div>` cannot be child of `<tbody>`)
6. **Modal scroll**: Added `onWheel` stop propagation on modal content divs to prevent scroll leaking to page
7. **Duplicate button removed**: Removed from table actions and page.js handler

### Auto-Save Issue
**Problem:** Photo upload/delete called Cloudinary API immediately on add/remove.

**Fix:** `photo-upload.tsx` now uses local `URL.createObjectURL()` previews. No API calls on add/remove.
- `family-editor.tsx` tracks pending uploads (File objects) and removed originals (URLs) via refs
- On **submit only**: uploads pending files → replaces preview URLs with real Cloudinary URLs → deletes removed originals → saves record

---

## 7. Hierarchy Auto-Linking

### Problem
Creating a new family (e.g., code `15`) placed it at the end of the list instead of under its parent family `1`.

### Root Cause
`createRecord` in `firestore-service.ts` saved the document but never updated the parent's `children` array. The BFS hierarchy walk in `loadAllRecords` only discovers records linked via parent `children` arrays.

### Fix (in `firestore-service.ts`)
When creating a new record, the system now:
1. Detects the parent by checking progressively shorter code prefixes (e.g., `15` → `1`)
2. Also checks `/` and `-` separator patterns (e.g., `3/2` → `3`)
3. Appends the new record to the parent's `children` array in Firestore
4. Next load → BFS discovers it in the correct hierarchy position

**Detection logic:**
- Code `15` → checks `1` (exists) → parent is `1`
- Code `150` → checks `15` (maybe), then `1` (exists) → parent is `1`
- Code `3/2` → slash check → parent is `3`

---

## 8. File Structure

```
app/admin/family/
  page.js                          ← Main page (rewritten)

components/family/
  family-editor.tsx                ← Create/edit modal
  family-view-dialog.tsx           ← View-only modal
  children-editor.tsx              ← DnD children table
  photo-upload.tsx                 ← Photo upload (deferred)
  pdf-preview.tsx                  ← PDF preview modal

components/family-dashboard/
  stats-cards.tsx                  ← Stats display
  search-bar.tsx                   ← Search input
  filters.tsx                      ← Filter dropdowns
  family-table.tsx                 ← Data table
  pagination.tsx                   ← Page navigation

components/ui-family/              ← shadcn components (still exist, not used by redesigned pages)
  badge.tsx, button.tsx, card.tsx, dialog.tsx, form.tsx,
  input.tsx, label.tsx, select.tsx, separator.tsx, slot.tsx,
  sonner.tsx, table.tsx, tabs.tsx, textarea.tsx

hooks/family/
  use-families.ts                  ← Data hook

services/family/
  firestore-service.ts             ← Firestore CRUD
  image-service.ts                 ← Cloudinary images
  pdf-service.ts                   ← PDF generation

types/family.ts                    ← TypeScript interfaces
lib/family-utils.ts                ← cn() utility
app/api/families/route.ts          ← Collection API
app/api/families/[code]/route.ts   ← Individual record API
public/pdf-assets/                 ← SVG icons for PDF
```

---

## 9. Nav Integration

`app/admin/layout.js` — NAV array updated:
```js
{ label: 'Family', href: '/admin/family', icon: '👨‍👩‍👧‍👦' }
```

---

## 10. Known Issues / Remaining

1. **TypeScript errors**: CSS `textAlign`/`userSelect` type narrowing warnings (non-blocking, `ignoreBuildErrors: true`)
2. **Hierarchy linking only at create time**: `updateRecord` does not re-link when code changes (manual move needed)
3. **New record `_fileOrder`**: Always `maxOrder + 1` (end of file order), but hierarchy position is correct when sorting by File Order
4. **`components/ui-family/` components**: Still in codebase but no longer imported by redesigned family pages

---

## 11. Session 2 — Inter-Family Marriage, API Conversion & Polish

### Inter-Family Marriage Editor

Created `components/family/inter-family-editor.tsx` — a dedicated modal for cross-family marriage records.

**Flow:**
1. Select Parent 1 from dropdown → children list appears as radio-style cards
2. Select Parent 2 from dropdown → children list appears
3. Pick one child from each → code auto-generates as `Child1/Child2`
4. Auto-populates: Child 1's name + DOB → Name/DOB fields, Child 2's name + DOB → Spouse Name/DOB fields
5. Tabs appear for editing remaining details (address, occupation, children, photos)

**Key details:**
- Uses `getFamilies()` from API to load all records
- Children of selected parents are derived from each record's `children` array
- Code field is read-only, derived from selections
- Save button disabled until both children are selected
- Added `"+ Inter-Family Marriage"` button to `page.js` alongside existing buttons

### API Conversion (Server Actions → Client Fetch)

Converted all client components from server action imports to `lib/api.js` fetch wrapper:

| File | Changes |
|---|---|
| `lib/api.js` | Added `getFamilies`, `addFamily`, `updateFamily`, `deleteFamily`, `getFamilyNextCode` |
| `app/api/families/route.ts` | Rewritten with `errorResponse` helper, calls server actions server-side |
| `app/api/families/[code]/route.ts` | Rewritten with `errorResponse` helper, fixed DELETE params to `Promise<>` |
| `app/api/families/next-code/route.ts` | New endpoint for code generation |
| `hooks/family/use-families.ts` | Uses `getFamilies()` from `lib/api.js` |
| `components/family/family-editor.tsx` | Uses `addFamily`, `updateFamily`, `getFamilyNextCode`, `getFamilies` from API |
| `components/family/delete-confirm-modal.tsx` | Uses `deleteFamily` from API |
| Zero server action imports from any client component | ✓ |

### Child Code Auto-Generation

**Problem:** `children-editor.tsx` used `Date.now()` as child code (e.g., `1784093116574`).

**Fix:** Added `parentCode` prop to `ChildrenEditor`. New `generateChildCode()` function:
- Regular parent (code `118`): children get `1181`, `1182`, `1183`...
- Inter-family parent (code `1112/4443`): children get `11121/44431`, `11122/44432`...

Also fixed `inter-family-editor.tsx` passing `value` instead of `children` prop to `ChildrenEditor`.

Made child code field **read-only** to prevent manual entry of `/`-codes as children.

### Delete Confirm Modal

Created `components/family/delete-confirm-modal.tsx` with dual confirmation:
- **Step 1:** Confirm dialog with family info
- **Step 2:** Type family code to confirm (button disabled until code matches exactly)

Added delete button (✕) to `family-table.tsx` with `onDelete` prop.

### PDF Loading State

Added spinner overlay in `pdf-preview.tsx` while generating PDF — shows "Generating PDF / Preparing X families..." with backdrop blur.

### Dashboard Family Book PDF

Updated `app/dashboard/family-book/page.js` — replaced static iframe to `/family-page.pdf` with dynamic `PdfPreview` component that generates PDF from live family data.

### Sidebar & Navigation Changes

| Change | File |
|---|---|
| Removed `Family` nav item from dashboard sidebar | `app/dashboard/layout.js` |
| Changed admin Family icon from emoji `👨‍👩‍👧‍👦` to `◈` (matches other sidebar icons) | `app/admin/layout.js` |

### Sort Fix

`hooks/family/use-families.ts` — When sorting by `"code"` ascending, no longer re-sorts with `localeCompare` (preserves DFS/hierarchy order from API). Descending just reverses the array.

### Cloudinary Consolidation

**Problem:** Two Cloudinary accounts in `.env.local` — main (`dq4odi8ij`) and admin (`bsaqrrl4`).

**Fix:** Consolidated all to single account `bsaqrrl4`:
- Updated `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `UPLOAD_PRESET` in `.env.local`
- Removed hardcoded fallback secrets from `services/family/image-service.ts`
- Both `lib/cloudinary/config.js` (general uploads) and `services/family/image-service.ts` (family photos) now use same account

### Vercel Configuration

Created `vercel.json`:
- Framework: Next.js
- Region: `sin1` (Singapore)
- API routes: no-cache headers
- Environment variables to set in Vercel dashboard documented

### Gitignore Updated

Added: `.env*.local` variants, `.vercel/`, `*.tsbuildinfo`, `next-env.d.ts`, `.vscode/`, `.idea/`, `Thumbs.db`, `admin/` (old standalone project)

### Email URL Fallback

Updated `lib/email.js` — `NEXT_PUBLIC_SITE_URL` is now optional, defaults to `https://pvtweb.vercel.app`.

### Bug Fixes

1. **DELETE route params** (`app/api/families/[code]/route.ts`): Changed `params: { code: string }` to `params: Promise<{ code: string }>` with `await` (Next.js 16 requirement)
2. **InterFamilyEditor hooks order**: Moved `groupedRecords` useMemo above early `return null` to fix "change in order of Hooks" error
3. **TypeScript syntax in .js file**: Removed `<FamilyRecord[]>` generic and unused import from `dashboard/family-book/page.js`

---

## 12. Updated File Structure

```
app/admin/family/
  page.js                          ← Main page (+ Inter-Family Marriage button)

app/api/families/
  route.ts                         ← GET/POST routes (rewritten with errorResponse)
  [code]/route.ts                  ← GET/PUT/DELETE routes (params await fix)
  next-code/route.ts               ← New: code generation endpoint

app/dashboard/family-book/
  page.js                          ← Updated: dynamic PDF preview

components/family/
  family-editor.tsx                ← Create/edit modal (API-based, no spouse dropdown)
  inter-family-editor.tsx          ← NEW: Inter-family marriage editor
  family-view-dialog.tsx           ← View-only modal
  delete-confirm-modal.tsx         ← NEW: Dual confirmation delete
  children-editor.tsx              ← DnD children table (parentCode prop, read-only codes)
  photo-upload.tsx                 ← Photo upload (deferred)
  pdf-preview.tsx                  ← PDF preview modal (+ loading overlay)

components/family-dashboard/
  stats-cards.tsx                  ← Stats display
  search-bar.tsx                   ← Search input
  filters.tsx                      ← Filter dropdowns
  family-table.tsx                 ← Data table (+ delete button)
  pagination.tsx                   ← Page navigation

hooks/family/
  use-families.ts                  ← Data hook (DFS-order-aware sort)

lib/
  api.js                           ← Central fetch wrapper (all family CRUD)
  api-helpers.js                   ← serializeDoc, errorResponse utilities
  email.js                         ← Updated: optional SITE_URL

services/family/
  firestore-service.ts             ← Firestore CRUD (generateNextCode, createRecord parent detection)
  image-service.ts                 ← Cloudinary images (no hardcoded secrets)
  pdf-service.ts                   ← PDF generation

types/family.ts                    ← TypeScript interfaces
vercel.json                        ← NEW: Vercel deployment config
```
