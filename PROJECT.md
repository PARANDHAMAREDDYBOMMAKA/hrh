# HRH — Hotels & Restaurants Hub

A B2B2C food ordering platform where a restaurant owner partners with hostels/hotels. Residents scan a QR code at their hostel to order meals (breakfast & dinner) through a batch cooking model.

---

## Business Model

- **You** = Restaurant owner (Admin)
- **Partners** = Hostels / Hotels / PGs where QR codes are placed
- **Customers** = Residents at those hostels who order food
- **Batch Cooking** = Orders close at a cutoff time, you cook only what's ordered, zero waste
  - Breakfast: orders close by 7:00 AM, delivery by 9:00 AM
  - Dinner: orders close by 5:00 PM, delivery by 8:00 PM
- **Revenue** = Customers pay you, partners earn commission per order

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, React 19, TypeScript) |
| Database | Azure PostgreSQL 15 (Flexible Server) |
| ORM | Prisma 7 with @prisma/adapter-pg |
| Auth | NextAuth.js v4 (JWT, Credentials provider) |
| State | TanStack Query (server state), React Context (cart) |
| UI | Tailwind CSS 4, Lucide icons, Sonner toasts |
| Storage | Azure Blob Storage (images container) |
| QR | qrcode.react (SVG + Canvas for download) |

---

## Azure Resources

| Resource | Name | Region |
|----------|------|--------|
| Resource Group | `hrh-rg` | Central India |
| PostgreSQL 15 | `hrh-db-server` → database `hrhdb` | Central India |
| Blob Storage | `hrhstorage1775621433` → container `images` | Central India |

---

## What's Done

### Landing Page (`/`)
- [x] Light theme with orange/amber gradients
- [x] Responsive navbar with mobile menu
- [x] Hero section with stats (500+ orders, 50+ partners, 4.9 rating)
- [x] Features section (5 cards with numbered labels)
- [x] How it Works (4-step process)
- [x] Pricing section (Free + Pro tiers)
- [x] Testimonials (3 cards with ratings)
- [x] CTA section
- [x] Footer with contact info
- [x] Scroll animations (fade-in, slide-up)

### Authentication
- [x] Login (`/login`) — email + password, show/hide toggle
- [x] Register (`/register`) — name, email, phone (numbers only, 10-digit validation), password
- [x] Email verification (`/verify`) — 6-digit code after signup
- [x] Change password (`/change-password`) — forced for partners on first login
- [x] Role-based redirects (Admin → admin dashboard, Customer → customer dashboard)
- [x] Success banners on login page (after verification, after password change)
- [x] Unverified user redirect to verify page
- [x] JWT sessions with 24h expiry

### Admin Panel (`/admin/*`)
- [x] Sidebar navigation (Dashboard, Menus, Partners, Orders)
- [x] Protected — requires ADMIN role
- [x] Mobile responsive with hamburger menu

#### Dashboard (`/admin/dashboard`)
- [x] Stats cards: total orders, today's orders, monthly revenue, commissions, active partners, customers
- [x] Recent orders table with status badges

#### Menus (`/admin/menus`)
- [x] Breakfast / Dinner tabs
- [x] Add items directly (no categories) — name, description, price, veg/non-veg
- [x] Toggle item availability
- [x] Delete items (with custom confirmation popup)

#### Partners (`/admin/partners`)
- [x] Add partner with full details (name, address, city, contact, phone, email, commission %, rooms)
- [x] Auto-creates partner login account (PARTNER role, random password, must change on first login)
- [x] Shows credentials popup after creation (copy button, one-time display)
- [x] QR code modal with 3 actions:
  - Download as PNG (with partner name + branding)
  - Share via WhatsApp (pre-filled message to partner's number)
  - Copy menu link
- [x] Toggle partner active/inactive
- [x] Delete partner (custom confirmation popup)
- [x] Partner list with status badge, commission %, order count

#### Orders (`/admin/orders`)
- [x] All orders list with status pipeline
- [x] Status progression: Pending → Confirmed → Preparing → Ready → Out for Delivery → Delivered
- [x] Cancel order option
- [x] Item breakdown, room number, delivery notes
- [x] Commission display per order
- [x] Auto-refresh every 30 seconds

### Customer Pages (`/customer/*`)
- [x] Protected — requires authenticated session
- [x] Mobile-first layout with bottom navigation
- [x] Header with user name and logout

#### Dashboard (`/customer/dashboard`)
- [x] Welcome message with user name
- [x] Stats: total orders, active orders, delivered count
- [x] Recent orders preview with status badges

#### Orders (`/customer/orders`)
- [x] Full order history
- [x] Status badges, item breakdown, partner name, room number

### Menu & Ordering (`/menu/[partnerId]/*`)
- [x] No login required to browse (QR scan lands here)
- [x] Breakfast / Dinner tabs
- [x] Order window status (open/closed with cutoff time display)
- [x] Veg/non-veg indicators
- [x] Add to cart with quantity controls
- [x] Cart persisted in localStorage
- [x] Single partner per cart (auto-clears if switching)
- [x] Bottom bar showing item count + total
- [x] Slide-up cart drawer

#### Checkout (`/menu/[partnerId]/checkout`)
- [x] Order summary with veg indicators
- [x] Room number input (required)
- [x] Delivery notes textarea
- [x] Auto-detect delivery slot (breakfast if before noon, dinner otherwise)
- [x] Cash on delivery label
- [x] Login required at checkout (redirects to login with callback URL)
- [x] Place order → clears cart → redirects to order history

### API Routes
- [x] `POST /api/auth/register` — with phone validation, email verification code
- [x] `POST /api/auth/verify` — 6-digit code verification
- [x] `POST /api/auth/change-password` — current + new password, clears mustChangePassword flag
- [x] `GET/POST /api/admin/menus` — list/create menu items by slot type
- [x] `PUT/DELETE /api/admin/menus/items/[id]` — update/delete items
- [x] `GET/POST /api/admin/partners` — list/create partners (with auto user creation)
- [x] `GET/PUT/DELETE /api/admin/partners/[id]` — single partner operations
- [x] `GET/POST /api/orders` — list user's orders / create order
- [x] `GET/PUT /api/orders/[id]` — get order details / update status
- [x] `GET /api/crm/analytics` — dashboard stats (used by admin dashboard)
- [x] `GET /api/setup` — one-time admin user + time slots creation (DELETE AFTER USE)

### Security
- [x] bcrypt password hashing (12 rounds)
- [x] JWT-only sessions (no DB sessions)
- [x] Role-based API protection (Admin check on all admin routes)
- [x] Server-side input validation (email, phone, password length)
- [x] Phone input — client-side numeric-only filter
- [x] Azure TLS minimum upgraded to 1.2
- [x] Forced password change for partner accounts
- [x] Email verification for customer accounts

### UI/UX
- [x] Light theme throughout (warm orange/amber palette)
- [x] Custom confirmation dialogs (no browser alerts)
- [x] Loading skeletons on data fetch
- [x] Toast notifications (Sonner)
- [x] Responsive on mobile + desktop
- [x] Smooth scroll animations on landing page
- [x] Gradient buttons with shadow effects

---

## What's Pending

### High Priority
- [ ] **Partner dashboard** — partners login but see admin dashboard (need separate partner view showing only their orders)
- [ ] **Delete `/api/setup` route** — security risk, remove after admin is created
- [ ] **Azure DB firewall** — currently allows all IPs (0.0.0.0–255.255.255.255), needs to be restricted
- [ ] **Image uploads** — Azure Blob code exists (`src/lib/azure-blob.ts`) but not connected to menu item UI
- [ ] **Order aggregation view** — "what to cook today" summary grouped by item across all partners

### Medium Priority
- [ ] **Payment integration** — currently cash on delivery only (Razorpay / Stripe)
- [ ] **Real-time notifications** — order status changes (push / SMS / email)
- [ ] **Partner-specific order view** — partners should only see orders from their hostel
- [ ] **Customer profile page** — edit name, phone, default room number
- [ ] **Forgot password** flow
- [ ] **Rate limiting** on auth endpoints
- [ ] **CSP / security headers** via middleware

### Low Priority / Future
- [ ] **CRM module** — planned as separate product (partner relationships, payouts, analytics, communication logs)
- [ ] **Order history export** (CSV/PDF)
- [ ] **Multi-restaurant support** — currently single restaurant, could scale to marketplace
- [ ] **Customer reviews & ratings**
- [ ] **Delivery tracking** (real-time)
- [ ] **Geo-fencing** — restrict orders to hostel radius (schema has lat/long fields)
- [ ] **Dark mode toggle**
- [ ] **PWA support** — installable on mobile
- [ ] **Email service integration** — actually send verification codes (currently code is in DB only)

---

## Database Schema (Simplified)

```
User (id, email, password, phone, name, role, partnerId, isVerified, mustChangePassword, ...)
Partner (id, name, address, city, contactPerson, phone, email, commissionRate, isActive, totalRooms, ...)
MenuItem (id, name, description, price, isVeg, isAvailable, slotType[BREAKFAST/DINNER], ...)
Order (id, orderNumber, partnerId, customerId, roomNumber, items[JSON], totalAmount, deliverySlot, status, commissionAmount, ...)
TimeSlot (id, name, slotType, orderCutoffTime, deliveryTime, isActive)
CustomerProfile (id, userId, defaultPartnerId, defaultRoomNumber)
CrmNote (id, partnerId, type, title, content, createdBy) — not active
Payout (id, partnerId, amount, period, orderCount, isPaid) — not active
VerificationToken (identifier, token, expires)
+ NextAuth models (Account, Session)
```

---

## Environment Variables

```
DATABASE_URL=postgresql://hrhadmin:***@hrh-db-server.postgres.database.azure.com:5432/hrhdb?sslmode=require
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=***
AZURE_STORAGE_ACCOUNT_NAME=hrhstorage1775621433
AZURE_STORAGE_ACCOUNT_KEY=***
AZURE_STORAGE_CONTAINER_NAME=images
```

---

## How to Run

```bash
npm install
npx prisma generate
npm run dev
# Visit http://localhost:3000/api/setup to create admin (one-time)
# Login: admin@hrh.com / admin123
```
