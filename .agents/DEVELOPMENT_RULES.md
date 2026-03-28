# Bible Study App — Development Rules

**Version:** 1.0
**Project:** Bible Study Tool (Next.js 16.2 + Neon + Vercel AI Gateway)

---

## 1. Database & Data Access

### 1.1 No ORMs
- **CRITICAL:** Do not use Prisma or Drizzle for API route logic.
- Use **Raw SQL with Template Tags** via the Neon serverless driver.
- Import: `import { getDbClient } from '@/lib/db'`

### 1.2 Template Literals Only
- ✅ `sql\`SELECT * FROM bible_verses WHERE book_number = ${bookNum}\``
- ❌ `sql('SELECT * FROM bible_verses WHERE book_number = ' + bookNum)`

### 1.3 IDs
- Use `crypto.randomUUID()` for all generated IDs.
- **Never** use `Math.random()`.

---

## 2. API Architecture

### 2.1 RESTful Conventions
- `GET /api/bible` — List
- `GET /api/bible/[book]/[chapter]` — Read
- `POST /api/bookmarks` — Create
- `PATCH /api/notes/[id]` — Update
- `DELETE /api/bookmarks/[id]` — Delete

### 2.2 Response Format
- **Success:** `NextResponse.json({ data: result })`
- **Success with meta:** `NextResponse.json({ data: result, meta: { total, page } })`
- **Error:** `NextResponse.json({ error: "Human-readable message" }, { status: N })`

### 2.3 Input Validation
- **CRITICAL:** All Zod schemas MUST be centralized in `@/lib/validations/`.
- No inline schemas in route files.
- `PATCH`/`PUT` routes taking `id` in URL: use `.omit({ id: true })` on body schema.
- `GET` routes with query params must validate via Zod, not string equality.

### 2.4 Structured Logging
- Format: `[API /route/path] event: details`
- Example: `console.error("[API /bible/search] Database error:", error)`

### 2.5 Rate Limiting
- All AI endpoints (`/api/chat`, `/api/ai/*`) must implement rate limiting.
- When Upstash Redis is configured, use `@upstash/ratelimit`.

---

## 3. Frontend Data Fetching

### 3.1 SWR Over useEffect
- **CRITICAL:** Do not use `useEffect` for data fetching.
- Use SWR hooks for all server data.
- SWR config requirements:
  - `revalidateOnFocus: true` — **ALWAYS**
  - `dedupingInterval: 2000` for volatile data (bookmarks, notes)
  - `dedupingInterval: 5000` for reference data (Bible text, dictionary)

### 3.2 localStorage for User Data
- Bookmarks, notes, reading history, reading plans, memorization — all in localStorage.
- Never treat localStorage as the primary state holder when SWR is available for the same resource.
- Provide optimistic UI updates: snapshot → update cache → fire API → rollback on failure.

### 3.3 Fetcher Pattern
```typescript
const fetcher = (url: string) => fetch(url).then(r => r.json()).then(res => res.data ?? res)
```

---

## 4. Security

### 4.1 XSS Prevention
- Never use `dangerouslySetInnerHTML` without `DOMPurify.sanitize()`.
- Bible text from the database is trusted (we seeded it), but any user-generated content (notes) must be sanitized.

### 4.2 Secrets
- Never hardcode API keys. Use `process.env`.

### 4.3 Authentication (Deferred)
- No auth in Phase 1. All Bible reference routes are public.
- When auth is added, every private route must use `import { getCurrentUser } from "@/lib/session"`.
- User-owned data queries must always include `WHERE user_id = ${session.userId}`.

---

## 5. UI/UX & Styling

### 5.1 Stack
- **Tailwind CSS 4** + **shadcn/ui** (new-york style, neutral base).
- Components in `components/ui/`.

### 5.2 Typography
- **EB Garamond** for Scripture and devotional text.
- **Geist Sans** for UI chrome (inherited from starter).

### 5.3 Theme
- Respect `next-themes` ThemeProvider (dark/light/system).
- Warm gold accent (`--gold` token) for Bible-themed elements.
- WCAG 2.1 Level AA contrast (4.5:1 for normal text).

### 5.4 Responsiveness
- Desktop-first, fully responsive down to 375px.
- Collapsible sidebar on mobile.

### 5.5 DRY Components
- Reuse components across contexts. If `VerseCard` exists, use it everywhere verses are displayed.

---

## 6. Code Quality

### 6.1 TypeScript
- Strict typing. Avoid `any`.
- Interfaces in `types/` directory.

### 6.2 Imports
- Absolute imports: `@/components/...`, `@/lib/...`, `@/types/...`

### 6.3 Comments
- Comment **why**, not **what**.

### 6.4 Error Handling
```typescript
try {
  const result = await sql`...`
} catch (error) {
  console.error('[API /bible/search] Database error:', error)
  return NextResponse.json(
    { error: 'Search failed', details: (error as Error).message },
    { status: 500 }
  )
}
```

---

## 7. Compliance Checklist (Quick Reference)

Run `/api-compliance-audit` workflow on any new or modified API route.

| # | Rule | Enforced Now? |
|---|---|---|
| 5 | Raw SQL only (no ORMs) | ✅ Yes |
| 7 | Centralized Zod validation | ✅ Yes |
| 8 | Zod `.omit({ id: true })` for URL params | ✅ Yes |
| 9 | `{ data }` response wrapping + structured logging | ✅ Yes |
| 12 | `crypto.randomUUID()` + rate limiting on AI | ✅ Yes |
| 1-4, 6 | Session, RBAC, RLS | ⏭️ When auth added |
| 10-11 | Ably, idempotency | ❌ Not applicable |
