---
description: Run a full API compliance audit against the 12-point checklist. Use when adding new API routes, refactoring existing ones, or performing periodic health checks.
---

# API Compliance Audit

**Target:** `app/api/` directory
**Objective:** Ensure every API route in this Bible Study application passes the 12-point architectural compliance checklist.

## EXECUTION DIRECTIVES
- **AUTONOMOUS OPERATION:** Do not pause for human confirmation. Execute refactoring across files continuously.
- **SILENT EXECUTION:** Do not output step-by-step explanations. Only output the necessary shell commands, file modifications, and the final refactored code.
- **CASCADE UPDATES:** If you modify a backend API route's response shape, you MUST automatically search the frontend codebase (SWR hooks in `lib/hooks/` and component fetchers) and update the corresponding HTTP calls and JSON unwrapping logic to prevent UI breakage.

---

## PHASE 1: DEDUPLICATION
1. Scan `app/api/` for routes performing identical or near-identical operations.
2. Keep the most RESTful route, update all frontend references, delete the duplicate.

## PHASE 2: N+1 ELIMINATION
1. Find `GET` routes with sub-routes that could be eager-loaded via `LEFT JOIN` + `json_agg`.
2. Consolidate into the parent `GET` route. Delete sub-route. Update SWR hooks.

## PHASE 3: PAYLOAD CONSOLIDATION
1. Merge fragmented `GET` endpoints into unified payloads where appropriate.
2. Keep granular `PATCH`/`PUT` routes for writes.

---

## PHASE 4: 12-POINT COMPLIANCE CHECKLIST

For every route, enforce these checks. Rewrite the file if it fails any.

### I. Session & Identity
1. **Session Consolidation:** Private routes must use `import { getCurrentUser } from "@/lib/session"`.
2. **RBAC:** Verify the actor's role before allowing the action.
3. **Actor Fallbacks:** Webhook routes must inject a fallback `userId` (e.g., `'system'`).

### II. Database Security
4. **RLS Context Injection:** Fire `await sql\`SELECT set_config('app.current_account_id', ${session.activeAccountId}, true)\`` before any Neon queries on user-owned data.
5. **Raw SQL Only:** Strictly use `sql\`...\`` template literals from `@/lib/db`. No ORMs. No string concatenation.
6. **Defense-in-Depth:** Every query on user-owned data must include `WHERE user_id = ${session.userId}` even with RLS active.

### III. Data Validation & Structure
7. **Centralized Zod:** All schemas imported from `@/lib/validations/`. No inline schemas.
8. **URL vs. Body IDs:** `PATCH`/`PUT` routes taking `id` in URL must use `.omit({ id: true })` on the body schema.
9. **`{ data }` Wrapping:** Responses: `NextResponse.json({ data: result })`. Errors: `NextResponse.json({ error: "..." }, { status: N })`. Logging: `console.error("[API /path] event:", error)`.

### IV. Infrastructure Safety
10. **Ably Prevention:** All `ably.publish()` calls must be `await`-ed inside `try/catch`.
11. **Idempotency:** Webhook triggers must check `idempotency_key` to drop duplicates.
12. **Crypto + Rate Limiting:** IDs via `crypto.randomUUID()`. AI endpoints rate-limited via Upstash Redis.

---

## APPLICABILITY NOTE (Bible Study App)

Not all 12 points apply equally in the current phase:

| # | Check | Current Status |
|---|---|---|
| 1-3 | Session/RBAC/Webhooks | **Deferred** — no auth yet. Apply when user accounts added. |
| 4 | RLS Context | **Deferred** — no user-owned data in DB yet. |
| 5 | Raw SQL | ✅ **Always enforced** |
| 6 | Defense-in-Depth WHERE | **Deferred** — no tenant-scoped data yet. |
| 7 | Centralized Zod | ✅ **Always enforced** |
| 8 | Zod .omit() | ✅ **Always enforced** |
| 9 | { data } wrapping | ✅ **Always enforced** |
| 10-11 | Ably/Idempotency | **N/A** — no real-time or webhooks. |
| 12 | Crypto + Rate Limiting | ✅ **Enforced on AI routes** |
