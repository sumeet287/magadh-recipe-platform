# Pending checklist — session (16 May 2026)

Items discussed or left open this session. Tick off as you complete them.

---

## 1. Amazon Solution Provider / Developer Central (blocker: “under review”)

- [ ] **Wait for** “developer registration is under review” to **clear** (use banner “view current status and details” + email on `magadhrecipe@gmail.com`).
- [ ] If Amazon asks for **extra docs or clarification**, respond within their deadline.
- [ ] After approval: click **+ Add new app client** → create **production** app client (not sandbox-only, when allowed).
- [ ] Copy **`LWA_CLIENT_ID`** and **`LWA_CLIENT_SECRET`** into hosting env (never commit to git).
- [ ] Run **OAuth / Authorize** flow for your seller account → obtain **`LWA_REFRESH_TOKEN`** (`Atzr|…` style).  
  _See Amazon docs: Selling Partner API authorization workflow._
- [ ] Set env (prod):
  - `LWA_CLIENT_ID`, `LWA_CLIENT_SECRET`, `LWA_REFRESH_TOKEN`
  - `AMAZON_MARKETPLACE_ID` — default India `A21TJRUUN4KGV` if only `.in`
  - `AMAZON_SP_API_REGION` — typically **`eu`** for India SP-API endpoint
  - `AMAZON_SP_API_SANDBOX` — **`false`** for real orders (or omit)
  - `AMAZON_SELLER_CENTRAL_REGION` — optional; `IN` vs `com` for Seller Central deep links
  - `CRON_SECRET` — already used; ensure Vercel has it for `/api/cron/amazon-orders-sync`
- [ ] Confirm **cron** (`vercel.json` → `amazon-orders-sync` **once daily**, `0 4 * * *` UTC ≈ morning IST; **Vercel Hobby allows at most daily** — hourly/4‑hour schedules fail deploy) deploys with env vars.

---

## 2. First successful sync → admin analytics (`/admin/analytics?channel=amazon`)

- [ ] After env is live: as admin call **Pull latest from Amazon** (or `POST /api/admin/amazon/sync-orders`).
- [ ] Confirm rows in DB: `amazon_marketplace_orders` / `amazon_marketplace_order_lines`.
- [ ] Tune if needed (env): `AMAZON_ORDERS_SYNC_LOOKBACK_DAYS`, `AMAZON_ORDERS_SYNC_MAX_LIST_PAGES`, `AMAZON_ORDERS_SYNC_MAX_ORDER_ITEM_FETCHES`  
  _(line items only for newest N orders per run — run cron multiple days to backfill SKUs.)_

---

## 3. Security / compliance (self-commitments)

- [ ] **`docs/compliance/incident-response-and-password-policy.md`** — fill blanks (security lead email, Postgres vendor name).
- [ ] Ensure **MFA** on Seller Central, GitHub (or repo host), Vercel, DB console, recovery email — matches what you attested on the Amazon form.

---

## 4. Operational / docs (nice-to-have)

- [ ] Optionally add internal runbook URL in Notion linking to cron path + env list (duplicate of `.env.example`).

---

## 5. Repo / CI (outside Amazon)

- [ ] **`npm run type-check`** fails on **`@vercel/analytics/next`** in `src/app/layout.tsx` — fix import or dependency when you next touch infra (pre-existing; not introduced by Amazon work).
- [ ] Run **`prisma migrate deploy`** (and `generate`) on any environment where `amazon_marketplace_*` tables are not migrated yet.

---

## 6. Known edge cases (only if hit in prod)

- [ ] SP-API returns **403 / auth errors**: confirm region + IAM/SigV4 expectations in current Amazon docs; Bizon SDK uses LWA token — escalate with exact error payload.
- [ ] **Ship-to city/state sparse**: may need **Restricted Data** / separate tokens for PII-heavy fields; analytics still valid on revenue/status/SKU without full address.

---

_Last updated: 2026-05-16._
