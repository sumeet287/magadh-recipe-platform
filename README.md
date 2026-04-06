# Magadh Recipe Platform

A production-ready full-stack ecommerce platform for **Magadh Recipe** — a premium Indian food brand selling authentic Bihar pickles, spices, and condiments.

**Tech Stack:** Next.js 15 · TypeScript · Tailwind CSS · Prisma · PostgreSQL · NextAuth v5 · Zustand · Razorpay · Nodemailer

---

## Features

- **Storefront** — Hero, categories, featured products, testimonials, newsletter
- **Product Catalogue** — Filters, sorting, pagination, search, spice level indicator
- **Cart & Checkout** — Zustand cart, coupon codes, multi-step checkout
- **Payments** — Razorpay online payment + COD, webhook handler
- **Authentication** — Credentials (email/password) + Google OAuth via NextAuth v5
- **User Accounts** — Profile, order history, addresses, wishlist
- **Admin Panel** — Dashboard, product CRUD, order management, review moderation
- **SEO** — Dynamic metadata, JSON-LD structured data, sitemap-ready
- **Security** — Rate limiting, HMAC webhook verification, timing-safe signature checks

---

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or Docker)
- A Razorpay account (test mode works)

### 1. Clone & Install

```bash
git clone https://github.com/yourorg/magadh-recipe-platform.git
cd magadh-recipe-platform
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
# Edit .env with your values
```

Required at minimum:
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — Random 32+ char string (`openssl rand -base64 32`)
- `NEXTAUTH_URL` — Your URL (e.g. `http://localhost:3000`)
- `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` — From Razorpay dashboard
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` — Same as `RAZORPAY_KEY_ID`

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (dev)
npm run db:push

# OR run migrations (production)
npm run db:migrate:prod

# Seed with sample data
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Admin panel:** [http://localhost:3000/admin](http://localhost:3000/admin)  
**Admin credentials:** `admin@magadhrecipe.com` / `Admin@123456`

---

## With Docker

```bash
# Start PostgreSQL only
docker-compose up postgres -d

# Then run app locally
npm run db:push && npm run db:seed && npm run dev
```

Or run entire stack:

```bash
docker-compose up -d
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Login, signup, forgot-password
│   ├── (storefront)/        # All customer-facing pages
│   │   ├── page.tsx         # Homepage
│   │   ├── products/        # Product listing + detail
│   │   ├── cart/            # Cart page
│   │   ├── checkout/        # Multi-step checkout + success
│   │   ├── account/         # User profile, orders, addresses, wishlist
│   │   ├── search/          # Search results
│   │   ├── about/           # Brand story
│   │   ├── contact/         # Contact form
│   │   └── legal/           # Privacy, Terms, Refund
│   ├── admin/               # Admin dashboard, products, orders
│   └── api/                 # All API route handlers
├── components/
│   ├── ui/                  # Button, Input, Badge, Rating, Pagination, Modal, Skeleton
│   ├── layout/              # Header, Footer, CartDrawer, SearchModal
│   ├── storefront/          # Hero, Categories, Testimonials, WhyUs, Newsletter
│   └── product/             # ProductCard, ProductGrid, ProductGallery, SpiceMeter
├── lib/
│   ├── auth.ts              # NextAuth v5 config
│   ├── prisma.ts            # Prisma client singleton
│   ├── razorpay.ts          # Payment helpers
│   ├── email.ts             # SMTP email sender
│   ├── utils.ts             # Utility functions
│   ├── constants.ts         # Brand constants, config
│   ├── errors.ts            # Typed error classes
│   ├── rate-limit.ts        # In-memory rate limiter
│   └── validations/         # Zod schemas
├── store/                   # Zustand stores (cart, wishlist, ui)
├── types/                   # TypeScript types
└── middleware.ts            # Route protection (auth + admin)
prisma/
├── schema.prisma            # Full database schema (22 models)
└── seed.ts                  # Seed data (9 products, categories, coupons)
```

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema changes (dev) |
| `npm run db:migrate` | Create & run migration |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:reset` | Reset database (dev only!) |
| `npm run type-check` | TypeScript type check |

---

## API Routes Summary

| Method | Route | Description |
|---|---|---|
| GET | `/api/products` | List products with filters & pagination |
| GET | `/api/products/[slug]` | Single product detail |
| GET | `/api/categories` | All categories |
| GET/POST/DELETE | `/api/cart` | Cart management |
| GET/POST | `/api/wishlist` | Wishlist toggle |
| GET/POST | `/api/orders` | Create & list orders |
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment signature |
| POST | `/api/payments/webhook` | Razorpay webhook handler |
| POST | `/api/coupons/validate` | Validate & calculate coupon |
| PATCH | `/api/users/profile` | Update user profile |
| GET/POST | `/api/users/addresses` | Manage addresses |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/forgot-password` | Password reset email |
| GET | `/api/search` | Full-text product search |
| GET | `/api/pincode` | Check delivery availability |
| POST | `/api/newsletter` | Newsletter subscription |
| POST | `/api/contact` | Contact form submission |
| GET | `/api/admin/dashboard` | Admin metrics |
| GET/POST | `/api/admin/products` | Admin product CRUD |
| GET/PATCH | `/api/admin/orders` | Admin order management |

---

## Seed Data

After running `npm run db:seed`:

**Categories:** Pickles, Masalas & Spices, Combo Packs, Gift Boxes, Regional Specials

**Products (9):**
- Aam Ka Achar (Mango Pickle) — Bestseller, Featured
- Lehsun Achar (Garlic Pickle)
- Mirchi Ka Achar (Red Chilli Pickle)
- Mix Achar (Mixed Pickle)
- Nimbu Ka Achar (Lemon Pickle) — New Arrival
- Bihari Masala Mix — New Arrival, Featured
- Sattu Spice Mix — New Arrival
- Magadh Pickle Trio Combo
- Festive Gift Hamper — Bestseller

**Coupons:** `WELCOME10` (10% off, max ₹100) · `FESTIVE10` (10% off, max ₹150) · `FREESHIP` (free shipping) · `MAGADH100` (₹100 off on ₹799+)

---

## Environment Variables Reference

See [.env.example](.env.example) for all required and optional environment variables.

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Set all environment variables in Vercel dashboard
4. Database: Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) for serverless PostgreSQL
5. Run migrations: `npx prisma migrate deploy`

### VPS / Docker

```bash
docker-compose -f docker-compose.yml up -d
```

---

## Security Notes

- Passwords hashed with bcryptjs (12 rounds)
- Razorpay webhook uses HMAC-SHA256 with `crypto.timingSafeEqual`
- Rate limiting on all sensitive endpoints (auth, checkout, contact)
- Admin routes protected by middleware + server-side session checks
- SQL injection impossible via Prisma ORM parameterized queries
- XSS prevention via React's default escaping

---

## License

MIT © Magadh Recipe
