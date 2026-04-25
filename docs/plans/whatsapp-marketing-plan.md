# WhatsApp Marketing & Phone Capture Plan

> **Goal**: Sab users ka phone DB me capture karna (soft-mandatory), naye WhatsApp number pe switch karna, abandoned checkout pe personalized coupon bhejna, aur admin ke liye broadcast system banana.
>
> **Created**: Apr 25, 2026
> **Status**: Planning — awaiting decisions before implementation

---

## Current State (Codebase Audit)

| Kya | Status |
|---|---|
| `User.phone` | Already hai — `String? @unique`, optional |
| `User.phoneVerified` | Boolean exists but **never set true by any code** |
| `phoneVerifiedAt` | Nahi hai |
| `marketingOptIn` | Nahi hai |
| WhatsApp provider | **Meta Cloud API** (Graph v21.0) — already configured |
| Existing template | Sirf `order_notification` — **admin ko** jaata hai, customer ko nahi |
| OTP flow | `OtpToken` table hai, par **code me use nahi hota** (dead) |
| Coupon model | Solid — `perUserLimit`, `startDate/endDate`, `usageLimit`, `CouponUsage` sab hai |
| Abandoned checkout tracking | Nahi hai. Sirf 30-min stale Razorpay order cleanup hai |
| Admin broadcast screen | Nahi hai |
| Current customer WhatsApp no. | `+91 6207197364` (hardcoded in `src/lib/constants.ts`) |

---

## Feature 1: Soft-Mandatory Phone (Popup, Never Block)

### Schema changes (`prisma/schema.prisma`)

```prisma
model User {
  // existing fields ...
  phone                  String?   @unique
  phoneVerified          Boolean   @default(false)
  phoneVerifiedAt        DateTime?            // NEW
  marketingOptIn         Boolean   @default(false)  // NEW
  marketingOptInAt       DateTime?            // NEW - Meta consent audit trail
  phonePromptDismissedAt DateTime?            // NEW - so popup doesn't nag forever
}
```

### Session payload
- Add `phone`, `phoneVerified`, `marketingOptIn` to `Session.user` type (`src/types/index.ts`) + JWT callback in `src/lib/auth.ts` — so frontend can decide whether to show popup without an API call.

### UI — "Update Your Number" popup
- **New component**: `src/components/phone-prompt-dialog.tsx`
  - Triggers: logged-in user + `!phone` + `phonePromptDismissedAt` is null OR older than **7 days**
  - Shown once per session (localStorage flag) + re-shown after 7-day cooldown
  - Close button works — no blocking, no forced submission
  - Mounted in storefront layout (`src/app/(storefront)/layout.tsx`)
- Fields: phone input (10-digit validated) + checkbox "Marketing WhatsApp messages bhejne ki permission hai" (pre-checked, required for Meta compliance if opted in)
- Submit → `PATCH /api/users/profile` (already exists, just needs to accept `phone` + `marketingOptIn`)

### "No nag" logic
- "Baad me" button → `POST /api/users/phone-prompt/dismiss` → sets `phonePromptDismissedAt = now()`
- Popup ko block karne ka koi mechanism nahi — user checkout karega to usko kabhi force nahi

### Should we OTP-verify the phone?
**Recommendation: Skip OTP for MVP.**
- User ka goal speed hai — "jaldi ho jaye sab ka number DB me"
- OTP add karega to friction badh jaayega (MSG91/SMS cost + 30-sec wait)
- Risk: bogus numbers aa sakte hain → but marketing msg fail silently, DB clean karna aasaan
- **Phase 2**: OTP verification add karna hai to `OtpToken` table + send-otp / verify-otp routes bana sakte hain (separate ticket)

---

## Feature 2: New WhatsApp Number Switch

### What needs to change
1. **Meta Business Manager pe naya number add/verify** (manual step in Meta)
2. **Naya `WHATSAPP_PHONE_NUMBER_ID`** milega — `.env` / Vercel env update
3. **Hardcoded numbers replace karna**:
   - `src/lib/constants.ts` — `SOCIAL_LINKS.whatsapp` (`wa.me/916207197364`)
   - Grep karke verify karunga koi aur jagah na ho
4. **Templates ko naye number pe re-approve karana padega** (Meta pe number-scoped hote hain) — ye business process hai, code me nothing

### Code touch points
- `src/lib/constants.ts` — naya number
- `.env.example` — document naya `WHATSAPP_PHONE_NUMBER_ID`
- `src/components/layout/whatsapp-float.tsx` — already uses `SOCIAL_LINKS.whatsapp` so automatic

---

## Feature 3: Abandoned Checkout → Personalized Coupon on WhatsApp

### 3a. Abandoned Checkout Detection — "Kab trigger kare?"

**Two approaches** — pick one:

| Approach | Pros | Cons |
|---|---|---|
| **A) Cart-based** (user ka cart me item hai, X hours idle) | Checkout page tak nahi pahuncha to bhi cover | "Abandoned checkout" nahi hai technically — ye abandoned cart hai |
| **B) Checkout-page-based** (user ne `/checkout` visit kiya + form start kiya + submit nahi kiya) | Zyada intent — higher conversion | Tracking setup chahiye |

**Recommendation: B** — kyunki specifically "checkout page pe koi leave kiya" scope hai.

**Implementation**:
- Nayi model: `CheckoutSession`

```prisma
model CheckoutSession {
  id             String   @id @default(cuid())
  userId         String?
  phone          String?   // captured from form even if user is guest
  email          String?
  cartSnapshot   Json      // items + total at time of abandonment
  totalAmount    Float
  status         CheckoutStatus @default(STARTED)
  // STARTED → ABANDONED → RECOVERED / EXPIRED
  lastActivityAt DateTime @default(now())
  couponSentAt   DateTime?
  couponId       String?
  orderId        String?   // if user eventually completed
  createdAt      DateTime @default(now())
  @@index([status, lastActivityAt])
  @@index([phone])
}

enum CheckoutStatus {
  STARTED
  ABANDONED
  RECOVERED
  EXPIRED
}
```

- On `/checkout` page mount (first form interaction) → `POST /api/checkout/session/start`
- On every field change (debounced) → `PATCH /api/checkout/session/heartbeat`
- On successful order creation → `status = RECOVERED`
- **Cron job** (extend existing `admin/orders/cleanup`): har 15 min ek check — `status=STARTED` + `lastActivityAt > 30 min ago` + `phone IS NOT NULL` + `couponSentAt IS NULL` → mark `ABANDONED` + trigger coupon+WA send

### 3b. Personalized Coupon Generation

**Design**: Har user ke liye **unique code** generate karenge

- **Code format**: `COMEBACK-<8char>` (e.g. `COMEBACK-A3F9K2QZ`)
- Uses existing `Coupon` model:
  - `code` = unique generated
  - `type = PERCENTAGE`
  - `value = 5`
  - `usageLimit = 1` (global, but since code is unique per user, effectively per-user)
  - `perUserLimit = 1`
  - `endDate = now() + 3 days` ← 3-day expiry
  - `startDate = now()`
- `CheckoutSession.couponId` → links to generated coupon
- **"At single time 1 user ko ek hi milega"** constraint: before generating, check if active `COMEBACK-*` coupon exists for this phone/user → skip if yes

### 3c. "Max 1 coupon apply" Constraint (global, not just abandoned)

Max 1 coupon per order apply ho. **Current state**: cart store me `appliedCoupon` single value hai so technically UI me already 1 hi apply hota hai. But order API me multiple coupon codes allow karti hai agar kisi ne direct API hit ki.

**Fix**: `src/app/api/orders/route.ts` me check — agar `couponCode` array aaya to reject, ya pehle hi hamesha single string accept karo (already hai). **Low-risk — probably already correct, just verify.**

### 3d. WhatsApp Template (Meta pe submit karna hai)

**Template name**: `abandoned_checkout_coupon`
**Category**: MARKETING
**Language**: Hindi or English (recommend: Hinglish mix — approved easily)

```
Namaste {{1}}!

Aapne Magadh Recipe pe cart chhod diya — hum apke liye ek special 5% off coupon rakh rahe hain.

Code: {{2}}
Value: 5% off on your entire order
Valid till: {{3}}

Order complete karein: {{4}}

Maa ke haath ka swaad mat miss karna!
```

Variables:
- `{{1}}` = user name
- `{{2}}` = coupon code
- `{{3}}` = expiry date formatted
- `{{4}}` = short link back to checkout (can be `yoursite.com/checkout?coupon=XYZ`)

**Approval time**: Meta pe 24-48 hours. Plan karke rakh.

### 3e. Send flow
- New file: `src/lib/whatsapp.ts` (refactor from `email.ts`) with helpers:
  - `sendWhatsAppTemplate(to, templateName, params[])` — generic
  - `sendAbandonedCheckoutCoupon(checkoutSession)` — specific
  - `sendBroadcastTemplate(phones[], templateName, params[])` — bulk
- Called by cron job from 3a

---

## Feature 4: Admin Broadcast (New Product / Any Template)

### Admin UI
- New route: `/admin/broadcasts`
- New page: `src/app/admin/broadcasts/page.tsx` — lists past broadcasts
- Sub-route: `/admin/broadcasts/new` — compose form:
  - **Template picker** — fetches from Meta API (ya hardcoded list for MVP)
  - **Variable inputs** — dynamic based on template
  - **Audience selector**:
    - All users with `phone IS NOT NULL AND marketingOptIn = true`
    - Filter by: has ordered / never ordered / has ordered in last N days
    - Preview count shown before send
  - **Send / Schedule** button

### Schema

```prisma
model Broadcast {
  id              String   @id @default(cuid())
  templateName    String
  templateParams  Json     // ordered array of param values
  audienceFilter  Json     // { type: "all" | "ordered" | "never_ordered", ... }
  totalRecipients Int
  sentCount       Int      @default(0)
  failedCount     Int      @default(0)
  status          BroadcastStatus @default(PENDING)
  // PENDING → SENDING → COMPLETED / FAILED
  createdBy       String   // adminId
  createdAt       DateTime @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  recipients      BroadcastRecipient[]
}

model BroadcastRecipient {
  id          String   @id @default(cuid())
  broadcastId String
  userId      String?
  phone       String
  status      String   // SENT / FAILED / OPTED_OUT
  messageId   String?  // Meta's wamid for tracking
  error       String?
  sentAt      DateTime?
  broadcast   Broadcast @relation(fields: [broadcastId], references: [id])
  @@index([broadcastId, status])
}

enum BroadcastStatus {
  PENDING
  SENDING
  COMPLETED
  FAILED
}
```

### Sending strategy (rate limits)
- Meta WhatsApp Cloud API tier 1 = **1000 unique users/day**, and **80 msg/sec** burst limit
- Implementation:
  - `POST /api/admin/broadcasts` → creates `Broadcast` + `BroadcastRecipient` rows (all PENDING), returns immediately
  - Background processor: batch of **50 recipients** → `sendWhatsAppTemplate` with `Promise.all` → wait **1 sec** → next batch
  - Store Meta's `wamid` for tracking delivery status (via existing `/api/webhooks/whatsapp`)
- **Serverless limitation**: Vercel function max 5 min. For 1000 recipients at 50/sec, fits. For larger audience, queue jiski zarurat padegi (Phase 2).

### New product arrival broadcast — use case walkthrough
1. Admin adds new product
2. Admin goes to `/admin/broadcasts/new`
3. Selects template `new_product_launch` (submitted separately to Meta)
4. Fills params: `{{1}}` = product name, `{{2}}` = product URL
5. Selects audience = all opted-in users
6. Preview: "Ye 347 users ko jaayega"
7. Send → background job kicks off → status page shows live progress

---

## Meta Templates Required (Submit BEFORE launch)

| Template Name | Category | Use |
|---|---|---|
| `abandoned_checkout_coupon` | MARKETING | Feature 3 |
| `new_product_launch` | MARKETING | Feature 4 example |
| `generic_promo` | MARKETING | Feature 4 flexible use |

**Note**: Ek Hindi version + ek English version dono submit karein — Meta dono approve kar dega, run time pe pick karenge user preference se (future enhancement).

---

## Implementation Phases (Recommended Order)

### Phase 1: Schema + Phone Popup (Day 1-2)
1. Prisma migration: add `phoneVerifiedAt`, `marketingOptIn`, `marketingOptInAt`, `phonePromptDismissedAt`
2. Session type + JWT callback update
3. `phone-prompt-dialog` component + storefront layout mount
4. `/api/users/phone-prompt/dismiss` endpoint
5. `/api/users/profile` PATCH — accept `marketingOptIn`
6. Signup form: add marketing opt-in checkbox

### Phase 2: WhatsApp Number Switch (Day 2 — can parallel with Phase 1)
1. Update env with new `WHATSAPP_PHONE_NUMBER_ID`
2. Update `SOCIAL_LINKS.whatsapp` in constants
3. Test `order_notification` template with new number
4. Submit 3 new templates to Meta for approval (starts 24-48h clock)

### Phase 3: Abandoned Checkout + Coupon (Day 3-5)
1. Prisma migration: `CheckoutSession`, `CheckoutStatus` enum
2. `/api/checkout/session/start` + `/heartbeat` endpoints
3. Wire up `/checkout` page to call them
4. Refactor `src/lib/email.ts` → split into `whatsapp.ts` with generic `sendWhatsAppTemplate`
5. Cron endpoint `/api/cron/abandoned-checkouts` (protected by `CRON_SECRET`) — batch coupon gen + WA send
6. Update `/api/orders` to mark `CheckoutSession` RECOVERED on success
7. Wait for `abandoned_checkout_coupon` template approval, then go live

### Phase 4: Admin Broadcast (Day 6-8)
1. Prisma migration: `Broadcast`, `BroadcastRecipient`, `BroadcastStatus` enum
2. Admin nav: add "Broadcasts" link
3. `/admin/broadcasts` list page
4. `/admin/broadcasts/new` compose page
5. `/api/admin/broadcasts` create + list endpoints
6. Background processor (`/api/admin/broadcasts/[id]/process` called via cron or immediate)
7. Recipient status view + retry failed

### Phase 5: Cron Setup (end of Phase 3 & 4)
- Vercel Cron (already using for stale orders): add 15-min cron → `/api/cron/abandoned-checkouts`
- Broadcast processing: either event-driven (kick off on create) or polling cron

---

## Decisions to Lock (Before Implementation)

| # | Question | Recommendation |
|---|---|---|
| 1 | OTP ab karna hai ya baad me? | **Baad me** — speed chahiye abhi |
| 2 | Abandoned checkout trigger timing | Checkout page start + **30 min** idle |
| 3 | Naya WhatsApp number kya hai? | **TBD** — Meta pe verify ho chuka hai ya nahi? |
| 4 | Marketing opt-in default | Pre-checked (opt-out model) — common in India |
| 5 | Coupon for anonymous checkouts (no login) | **Yes** — bade conversion win |
| 6 | Broadcast audience filters (MVP) | "All opted-in" sufficient initially |
| 7 | Templates ka language | **Hinglish** — relatable + approval fast |
| 8 | Dead `OtpToken` table | **Rakho** — future OTP phase me use hoga |

---

## Open Questions / Risks

- Meta tier 1 rate limit (1000/day) — agar user base is se bada ho jaaye, tier upgrade apply karna padega
- Template approval fail ho sakta hai — backup language variants submit karna safe hai
- Cron reliability on Vercel — Pro plan daily cron limit check karna (currently `vercel.json` me configured hoga)
- Abandoned checkout me `phone` nahi hai (user ne form me enter hi nahi kiya) → coupon bhej hi nahi sakte → metric track karna chahiye "how many abandoned with phone vs without"

---

## Related Files (Quick Index)

| Area | Path |
|------|------|
| Schema | `prisma/schema.prisma` |
| NextAuth | `src/lib/auth.ts` |
| Signup | `src/app/(auth)/signup/page.tsx` |
| Register API | `src/app/api/auth/register/route.ts` |
| Profile | `src/app/(storefront)/account/page.tsx` |
| Profile API | `src/app/api/users/profile/route.ts` |
| Emails + WhatsApp orders | `src/lib/email.ts` |
| WhatsApp constants | `src/lib/constants.ts` |
| Pay verify + notifications | `src/app/api/payments/verify/route.ts` |
| Admin layout | `src/app/admin/layout.tsx` |
| Coupons (admin) | `src/app/admin/coupons/page.tsx` |
| Coupon validate | `src/app/api/coupons/validate/route.ts` |
| Order cleanup cron | `src/app/api/admin/orders/cleanup/route.ts` |
| Env template | `.env.example` |
