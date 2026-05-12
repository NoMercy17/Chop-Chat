# Session Handoff — Chop & Chat (2026-05-12)

This document covers everything built and changed in this session: AI review optimisations, DRY refactoring, comment moderation, UX improvements, and rate-limiting updates.

---

## 1. What Works

### AI Review — Skip Redundant Gemini Call on Share Path
**Problem:** When a user shared after an AI review, `POST /posts` called `validateFoodImage` again on the same image — a second Cloudinary fetch + Gemini call adding ~2–4 s of latency and wasting a free-tier call.

**Fix:**
- Added `image_url TEXT` column to `ai_review_logs` (migration applied to running Postgres, also in `init.sql`).
- `POST /ai/analyze` now stores the image URL alongside `user_id` in `ai_review_logs`.
- `POST /posts` checks for a matching `ai_review_logs` entry for this user + image within the last 30 minutes before calling `validateFoodImage`. If found, skips the Gemini call entirely.

**Result:** The share path after AI review is now instant (no second Gemini round-trip).

---

### Per-User Daily Limits
Added daily caps to protect the Gemini free-tier budget (≈1000 RPD):

| Path | Limit | Enforced via |
|---|---|---|
| `POST /posts` | 5 posts/day | `COUNT(*)` from `posts` table |
| `POST /chef/submit-with-review` | 3 requests/day | `COUNT(*)` from `chef_review_requests` |
| `POST /ai/analyze` | 3 reviews/day | existing `ai_review_logs` |

Returns HTTP 429 with `daily_*_limit_exceeded` error code. Frontend shows "Daily Limit Reached" alert (not generic "Upload Failed").

---

### `DELETE /ai/cleanup` Rate Limiter
**Problem:** The cleanup endpoint had no rate limiting — a valid token could probe public IDs indefinitely.

**Fix:** Added `cleanupLimiter` (20 req/min per IP) before `authenticateToken` in `ai.js`.

---

### Gemini Timeout in `validateFoodImage`
**Problem:** `model.generateContent` had no timeout. A Gemini hang would block `POST /posts` indefinitely.

**Fix:** Wrapped the call in `Promise.race` with a 12-second timeout. On timeout, fails open (comment/post proceeds).

---

### DRY Refactoring — Shared Helpers and Cloudinary Service
**Problem:** `relativeTime()`, `initials()`, and `getPublicIdFromUrl()` were copy-pasted identically in both `posts.js` and `chef.js`. `cloudinary.config({...})` was duplicated across 3 route files.

**Fix:**
- Created `backend/utils/helpers.js` — single source for all three helpers.
- Created `backend/services/cloudinary.js` — configures and exports the Cloudinary v2 instance once.
- `posts.js`, `chef.js`, and `ai.js` now import from these shared files.
- ~60 lines of duplicate code removed.

---

### Comment Moderation System
**Goal:** Block heavy content (death threats, sexual harassment, child content, hate speech) while allowing banter, harsh jokes, swearing, and food hyperbole.

**What was tried first (failed):**
- **OpenAI Moderation API** — free-tier accounts are limited to 3 RPM. Every call returned HTTP 429 immediately in testing. Silently failed open (all comments allowed). Dropped.
- **Gemini text moderation** — used `gemini-flash-lite-latest`, which gave repeated 503 errors and timeouts under any load. Also failed open. Dropped.

**Final approach — local regex patterns (works perfectly, 0 ms):**

File: `backend/services/moderation.js`

Categories blocked:
- **Self-harm:** "kill yourself", "kys", "go die", "end your life", "hang yourself" + all leet variants (`ki11`, `k1ll`, `k111`, `k i l l ur s e l f`)
- **Death threats:** "i will/i'll kill/murder/stab/shoot/harm you", "i will kill [anything] you" (`.{0,35}` between verb and target), "you deserve/should/need to die"
- **Standalone hostile words:** "die" and "kill" as standalone comments — **unless followed by `for`** ("die for this pasta", "kill for a bite" are food hyperbole and allowed)
- **Sexual harassment:** "send nudes", "show me your [body parts]", rape/assault threats, "you whore/slut/cunt"
- **Child protection:** "child porn", "minor sex", "underage nude", "loli content", "send cp" — zero tolerance
- **Racial slurs:** n-word (full: nigger/nigga/niggaz + leet n1gger/n!gga; abbreviated: nig/nigg/n1g/n1gg), spic/sp1c/sp!c, chink/ch1nk, kike, wetback, gook, beaner, sand n—, porch monkey, jigaboo, coon, and more

**Leet speak handled via:**
- `normalize()` function: `3→e`, `0→o`, `$→s`, `@→a`, collapses spaced chars (`k i l l` → `kill`)
- Pattern-level character classes: `[i!1]` for i/1/!, `[l1]` for l/1, `[ae]` for a/e — covers all common leet variants without relying solely on normalization

**False positives explicitly tested and passing:**
- "spiced", "spice", "spices" (contain "spic" — `\b` boundary protects)
- "Niger", "Nigeria", "Nigerian" (contain "nig" — no word boundary after "nig" in longer words)
- "niggardly" (legitimate English word — no boundary after "nigg")
- "coonhound" (lookahead `(?!\s*(dog|hound))` protects)
- "killing it", "you're killing it", "this is killing me" — `\bkill\b` does not match `killing`
- "i will kill for a bite", "i'd kill for this" — `kill for` is whitelisted

**Test suite: 42+ cases, 0 failures.**

---

### Comment UX — Optimistic Updates + Inline Errors
**Problems:**
1. Comments only appeared after the full round-trip (moderation + DB + network = ~1–2 s perceived lag).
2. All 4 comment submit handlers cleared the input text *before* `await addComment()` — if rejected, the user's text was gone.
3. Rejected comments showed a disruptive Alert popup rather than an inline error.

**Fix (all 4 comment locations updated: `AllCommunityPosts`, `AllChefReviews`, `CommunityFeed`, `FeaturedChef`):**
- Comment appears in the list instantly on tap (optimistic, temp ID `temp-${Date.now()}`).
- On success: temp comment replaced with real server response.
- On rejection (`blocked: true`): temp comment removed, input text restored, inline error shown.
- On network error (`null`): temp comment removed, text restored, Alert shown (correct — nothing the user can edit fixes a server crash).

**`CommentsModal` updated:** Added `errorMessage` prop — shows in red above the input row. Clears automatically when the user starts typing or closes the modal.

---

### Comment Rate Limit Improvements
- `commentsWriteLimiter`: 40 → **60 per 15 min** (AI moderation removed, no per-comment API cost).
- `commentsBurstLimiter`: 1/3 s → **1/2 s** (slightly faster posting, still prevents rapid spam).
- Both limiters now include a proper JSON `message` field (previously plain text → `api.js` couldn't parse it, surfaced as "API request failed" instead of the actual reason).
- Second limiter (`commentsBurstLimiter`) placed **before** `commentsWriteLimiter` and before `authenticateToken` — cheapest check runs first.

---

### Alert Title Improvements in MainActions
Frontend (`components/home/MainActions.js`) — all three catch blocks now check error type:
- `err.status === 429` → "Daily Limit Reached"
- `err.data?.error?.startsWith('Image rejected')` → "Image Not Eligible"
- Everything else → original title ("Post Failed", "Submission Failed", etc.)

---

### Context Error Handling — Inline vs Alert
`PostsContext.addComment` and `ChefFeedContext.addComment` now return `{ blocked: true, message }` instead of showing Alert for:
- `comment_rejected` (moderation block)
- `429` (rate limit — "You're posting too fast")
- `404` (post/review deleted while modal open)

Alert is still used for `500` / network errors — those are server-side and not actionable from the input box.

---

## 2. What Didn't Work

### OpenAI Moderation API
- **Problem:** Free-tier accounts are hard-capped at 3 RPM. Every call 429'd immediately.
- **Failure mode:** Silent fail-open — comments went through as if moderation was disabled.
- **Diagnosis:** Confirmed via direct HTTPS call (`STATUS: 429 Too Many Requests`).
- **Why it's not fixable without paying:** Rate limit is account-tier, not usage-based. Would require a paid OpenAI account.

### Gemini for Text Moderation
- **Problem:** `gemini-flash-lite-latest` is unstable under any concurrent load (503 Service Unavailable, timeouts).
- **Failure mode:** Fail-open (10-second timeout → no block → comment goes through).
- **Why it's not fixable by switching models:** The root issue is synchronous moderation via external API. Any network call introduces failure modes. The regex approach makes the API question irrelevant.

---

## 3. Files Changed — Largest to Smallest

| File | Changes |
|---|---|
| `backend/services/moderation.js` | **Full rewrite** × 2 (OpenAI → Gemini → local regex). Final: 78-line local pattern engine with leet normalization, 5 categories |
| `components/home/MainActions.js` | Better alert titles for 429/400, `{ blocked: true }` handling in AI share path |
| `backend/routes/posts.js` | Skip-AI-validation logic, per-user daily post limit, DRY helpers import, moderation call sync, burst+quota comment limiters with JSON messages |
| `backend/routes/chef.js` | Per-user daily chef request limit, DRY helpers import, moderation call sync, burst+quota comment limiters |
| `context/PostsContext.js` | `addComment` returns `{ blocked, message }` for inline errors; handles 429 + 404 inline |
| `context/ChefFeedContext.js` | Same as PostsContext |
| `screens/AllCommunityPosts.js` | Optimistic comment update pattern, `commentError` state, passes `errorMessage` to CommentsModal |
| `screens/AllChefReviews.js` | Same as AllCommunityPosts |
| `components/home/CommunityFeed.js` | Same as AllCommunityPosts |
| `components/home/FeaturedChef.js` | Same as AllCommunityPosts; also clears `commentError` on modal close |
| `components/posts/CommentsModal.js` | Added `errorMessage` prop, inline error text above input, `inputRow` wrapper View for layout |
| `backend/routes/ai.js` | `cleanupLimiter` added; `image_url` stored in `ai_review_logs` INSERT; shared cloudinary import |
| `backend/services/gemini.js` | `Promise.race` timeout on `validateFoodImage` Gemini call |
| `backend/init.sql` | `image_url TEXT` column added to `ai_review_logs`; `ALTER TABLE … ADD COLUMN IF NOT EXISTS` for existing DBs |
| `backend/utils/helpers.js` | **New file** — `relativeTime`, `initials`, `getPublicIdFromUrl` |
| `backend/services/cloudinary.js` | **New file** — single configured Cloudinary v2 export |
| `backend/index.js` | Removed stale OPENAI_API_KEY warning |

---

## 4. Things Worth Mentioning

**Rate limit order matters:** All IP-based limiters sit *before* `authenticateToken`. Cheap check first — reject before spending CPU on JWT verification. This is consistent across every limiter in the codebase.

**`\bkill\b` vs `killing`:** The word boundary `\b` after `kill` means the pattern does NOT match `killing`, `kills`, or `killed`. Only the exact word "kill" triggers the block. This is why "you're killing it" passes while "kill" alone is blocked.

**`(?!\s+for\b)` negative lookahead:** Used on both `die` and `kill` standalone patterns. Allows food hyperbole ("to die for", "kill for a bite") while blocking hostile standalone usage. Consistent rule: if followed by "for", it's a food expression.

**Optimistic comment temp ID:** Uses `temp-${Date.now()}` string ID. The real server comment has a numeric integer ID. The `curr.map(c => c.id === tempId ? result : c)` replacement works because string ≠ integer — no accidental collision possible.

**AI review share path bypass is safe:** The skip-validation check requires both `user_id` AND `image_url` to match a `ai_review_logs` entry within 30 minutes. A user can't bypass food validation for a different image by having any recent AI review.

**Gemini free-tier math (current daily usage ceiling):**
- 3 AI reviews/user × N users = 3N calls
- 5 regular posts/user × N users = 5N calls (validateFoodImage, skipped if from AI share)
- 3 chef requests/user × N users = 3N calls
- For 50 active users/day: ~550 Gemini calls — well within 1000 RPD free tier.

**OpenAI key in `.env`:** Still present but unused. Can be removed.
