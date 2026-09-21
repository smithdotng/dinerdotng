# Diner.ng

Listings, QR menus, guest reviews and table reservations for Nigerian restaurants, hotels, lounges, cafés and event hotspots.

**Stack:** Next.js 15 (App Router, Server Actions, TypeScript) · MongoDB (Mongoose) · iron-session · Flutterwave · Bootstrap + the warm Diner.ng theme (`public/css/diner.css`, built on the template's Jost / Bootstrap / Font Awesome vendors in `public/assets/vendors`).

## What it does

**Guests**
- Browse and search spots by city, type and cuisine (`/explore`)
- Spot page with photos, menu, opening hours, map link, ratings breakdown and reviews (`/spots/[slug]`)
- Mobile QR menu with category tabs and search (`/m/[slug]`, optional `?table=T4`)
- Rate & review (overall + food, service, ambience) from the spot page or right from the QR menu
- Book a table at Sweet-tier spots and get a booking code (`/reservations/[code]`, guest can cancel)

**Owners** (`/dashboard`)
- Sign up → set up spot → pick a plan → live
- Spot profile, opening hours, cover, logo and gallery photos
- Menu manager: categories (add / rename / reorder), dishes with price, photo, labels, sold-out toggle
- QR code: copy link, download PNG, printable table cards
- Reviews: filter, reply publicly, hide
- **Sweet only:** reservations (confirm / seat / complete / no-show, assign tables, add walk-ins), table management (seats, areas, live status), per-table QR codes, featured placement

**Admin** (`/admin`): stats and revenue, feature/unpublish spots, record offline payments to activate a plan, suspend accounts, payment log.

## Plans

| | Basic | Sweet |
|---|---|---|
| Monthly | ₦14,999 | ₦22,999 |
| First month (first customer discount) | ₦2,999 | ₦5,999 |
| Listing + QR menu + reviews | ✓ | ✓ |
| Featured spot, book-a-table, table management | – | ✓ |

"First customer" = an account that has never paid. Plans run 30 days; renewing the same plan extends the period. Prices live in `lib/plans.ts`. Set `FIRST_CUSTOMER_PROMO=false` to switch the discount off.

## Getting started

```bash
npm install
cp .env.example .env.local      # then fill in MONGODB_URI and SESSION_SECRET
npm run create-admin            # uses ADMIN_EMAIL / ADMIN_PASSWORD from .env.local
npm run seed                    # optional: fictional demo spots (password: demo-password)
npm run dev                     # http://localhost:3000
```

### Payments
Payments use **Flutterwave Standard** (hosted checkout: card, bank transfer, USSD). Without `FLW_SECRET_KEY` the app runs in **demo mode** — choosing a plan activates it instantly with no charge.

1. Put your Flutterwave secret key in `FLW_SECRET_KEY` (use the `FLWSECK_TEST-…` key while testing).
2. Owners are sent to Flutterwave's checkout; Flutterwave redirects back to `/dashboard/billing/verify`, which verifies the transaction with Flutterwave (status, reference, currency and amount) before activating the plan.
3. Optional but recommended: in Flutterwave › Settings › Webhooks set the URL to `https://your-domain/api/flutterwave/webhook` and a secret hash, and put the same hash in `FLW_WEBHOOK_HASH`. This activates plans even if the owner closes the tab before the redirect.

Set `APP_URL` to your live domain so redirects and QR codes use it.

### Photo uploads
Photos are resized in the browser (max 1600px) before upload, then stored in:
1. **Vercel Blob** when `BLOB_READ_WRITE_TOKEN` is set (recommended on Vercel),
2. **Cloudinary** when the `CLOUDINARY_*` variables are set,
3. otherwise `./uploads` on local disk (local dev / VPS only — not persistent on Vercel).

## Project layout

```
app/(site)        public pages: home, explore, pricing, for-business, spots, reservations
app/(auth)        login, register, onboarding
app/m/[slug]      mobile QR menu
app/dashboard     owner dashboard (+ billing/verify route)
app/admin         admin area
app/print/qr      printable QR table cards
app/api/qr        QR PNG download
app/api/flutterwave/webhook  Flutterwave payment webhook
actions/          Server Actions (auth, public, owner, admin)
lib/              db, session, plans, spot rules, storage, flutterwave, qr, helpers
models/           Mongoose models: User, Spot, MenuItem, Review, Table, Reservation, Payment
components/       UI components
seed/             createAdmin + demo seed
```

## Deploying to Vercel

1. **Database** — create a free MongoDB Atlas cluster (pick a region close to your Vercel region, e.g. AWS eu-west / London for `lhr1`).
   In Atlas › Network Access allow `0.0.0.0/0` (Vercel uses dynamic IPs), create a database user, and copy the connection string.
2. **Push this repo to GitHub**, then in Vercel choose **Add New › Project › Import** and select the repo. Framework is detected as Next.js; no build settings need changing.
3. **Environment variables** (Project › Settings › Environment Variables):

   | Variable | Value |
   |---|---|
   | `MONGODB_URI` | your Atlas connection string, e.g. `mongodb+srv://user:pass@cluster.xxxx.mongodb.net/dinerdotng` |
   | `SESSION_SECRET` | a random string of 32+ characters (`openssl rand -base64 32`) |
   | `APP_URL` | your live URL, e.g. `https://diner.ng` (used for QR codes and payment redirects) |
   | `FLW_SECRET_KEY` | Flutterwave secret key (leave out to run in demo mode) |
   | `FLW_WEBHOOK_HASH` | the secret hash you set in Flutterwave › Settings › Webhooks |
   | `FIRST_CUSTOMER_PROMO` | `true` (or `false` to end the launch discount) |

   **Don't add `NODE_ENV`** (Vercel sets it) and don't paste your local `.env` wholesale — it contains development-only values.

4. **Photo storage** — in the Vercel project open **Storage › Create › Blob**, connect it to the project; `BLOB_READ_WRITE_TOKEN` is added automatically. Redeploy.
5. **Deploy**, then create your admin account from your machine against the production database:
   ```bash
   MONGODB_URI="<atlas uri>" ADMIN_EMAIL=you@diner.ng ADMIN_PASSWORD='strong-password' npm run create-admin
   ```
6. **Flutterwave** — set the webhook URL to `https://<your-domain>/api/flutterwave/webhook`. Switch to your live secret key when you're ready to take real payments.
7. **Domain** — add `diner.ng` under Project › Settings › Domains and update `APP_URL`.

> Don't run `npm run seed` against production — it loads fictional demo spots.
