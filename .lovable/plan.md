

# SecretGPV — Private Photo Sharing SaaS Platform

## Overview
Ultra-fast, secure SaaS platform for private photo sharing with Firebase auth, Cloudflare R2 storage, device fingerprinting, vault system, QR codes, redeem-based payments, referral rewards, and admin panel.

---

## 1. Project Foundation & Design System
- Dark premium theme with blue/green/golden accents
- Copy uploaded logo to project assets for branding
- Create `OrbitalLoader` component from provided HTML/CSS (3 rotating rings + pulsing text)
- Use OrbitalLoader globally for all loading states
- Set up Firebase SDK with provided config
- Install dependencies: firebase, fingerprintjs, browser-image-compression, qr-code-styling, html2canvas, canvas-confetti

## 2. Landing Page
- Premium dark hero section with logo + "SecretGPV" branding
- Navigation: Features, Pricing, Privacy Policy, Terms & Conditions, About Us, Contact
- Hero with privacy-focused headline, security subtext, blinking "Get Started" CTA
- Features section, pricing cards (Pro $3 / Premium $7), footer with contact (secretgpv@gmail.com)
- Fully responsive, mobile-first

## 3. Authentication System
- Firebase Google Authentication with premium styled UI
- **Pre-Auth Consent Gate**: Modal with collapsible Privacy Policy & Terms, Cancel/I Agree buttons
- Store `termsAccepted` and `termsAcceptedAt` in Firestore on agreement
- Optional invite code field (auto-fill from referral link URL param)
- Device fingerprinting with `@fingerprintjs/fingerprintjs` — generate `visitorId` before login
- On signup: send email, deviceId, inviteCode, metadata to Worker `/register`
- Redirect logic: after login → Dashboard; if already logged in → auto redirect

## 4. Dashboard
- Header: SecretGPV logo (left), Upgrade button + Profile + 3-dot menu (right)
- **Profile page**: Google photo, name, email, join date, logout, back button
- **Menu**: Privacy Policy, Terms, About, Contact links
- **Plan & Stats**: Current plan, credits, total vaults, plan expiry
- **Invite section**: Unique referral link, copy button, Web Share API (navigator.share)
- **Global Announcement banner**: text + "Visit Now" button (from admin config, real-time via onSnapshot)
- Credit display with real-time Firestore sync (onSnapshot)

## 5. Vault System
- List all user vaults with status indicators
- Floating "+" button → Create Vault flow
- **Create Vault form**: PIN (4-6 digit), reminder text, visibility (Public/Private/Custom Gmail), download control toggle
- Self-destruct: always on (Pro: 500 views max, Premium: unlimited)
- Expiry: custom duration (minutes/hours/days)
- **Image Upload (Rocket Upload System)**:
  - Multi-image select, heavy compression (browser-image-compression, max 1200px, ~800KB, useWebWorker)
  - Parallel batch upload (3-4 concurrent) to Cloudflare R2 via Worker PUT endpoint
  - Unique filenames via `crypto.randomUUID()`
  - Upload states: uploading/success/error with thumbnails, remove, retry buttons
  - Live credit deduction: 1 image = 1 credit
  - Disable upload if credits exhausted

## 6. QR Code System
- Generate QR using `qr-code-styling` with gradient dots (blue→purple→green), logo in center
- Premium card UI with confetti burst animation on generation
- Includes reminder text + "Powered by SecretGPV Vault" footer
- Download QR as image via `html2canvas`
- WhatsApp share button
- **QR Security**: All QR links point to `/v/${vaultId}` route
- Flow: QR → /v/:id → PIN entry → Worker verification → Gallery

## 7. Vault Viewer & Gallery
- PIN entry screen with red snake animation on wrong PIN
- Correct PIN → Worker verifies → returns signed URLs + sessionToken
- Route guard: no sessionToken → redirect back to PIN
- **Gallery**: Fullscreen, pinch-to-zoom, swipe navigation, smooth transitions, back button
- Screenshot protection (CSS overlay technique)
- No download if disabled by vault owner
- View count increment on each successful unlock (strict, no duplicates)

## 8. Referral & Reward System
- Unique referral link per user
- Track referrals in Firestore "referrals" collection (inviterId, referredUserId, status: free/paid)
- Dashboard shows Total Referrals sorted: paid first, then free
- Real-time status updates via onSnapshot (when referred user activates paid plan → status becomes "paid")
- **Gift Box UI**: "Get Free Pro Plan" with progress tracker
- 5 paid referrals = eligible for free Pro Plan (30 days)
- Rules: can't activate if already on paid plan, can't stack plans, one-time reward flag
- Referral reward (+5 credits) only if referrer is paid user AND device is unique

## 9. Redeem Code System (Payment Replacement)
- "Activate Now" button → Modal with plan details + redeem code input
- Validation via Worker `/redeem`: code exists, not expired, not disabled, usage limit not exceeded
- Success → activate plan, assign credits (Pro=500, Premium=1200)
- Error messages: invalid, expired, already used, limit reached
- Success animation on redeem
- Real-time credit sync via onSnapshot

## 10. Admin Panel (`/sxt-tahir`)
- Google Auth with Firebase custom claims (`admin: true`) — no hardcoded passwords
- Route protection: verify admin claim, redirect non-admins
- **Dashboard**: Total users, total vaults, 24h growth stats (real-time)
- **Announcement system**: text + URL input, toggle ON/OFF
- **Redeem Code Management**:
  - Generate codes (format: SGPV-XXXXXXXX), manual create
  - Set value, plan, expiry, usage type (one-time/multi-use), tags, notes
  - Table view: Code, Plan, Value, Status, Usage Count, Expiry, Tag
  - Actions: disable/enable, delete, regenerate, view usage history
- **Usage Logs**: userId, code, timestamp, IP, device info, suspicious activity flagging

## 11. Pages & Legal
- Privacy Policy page
- Terms & Conditions page
- About Us page
- Contact page
- 404 Not Found page

## 12. Firestore Security Rules
- Full Firestore rules provided covering:
  - `/users` — owner-only read/write
  - `/vaults` — owner CRUD, public read for public vaults
  - `/devices` — owner-only
  - `/referrals` — restricted
  - `/redeem_codes` — no public access
  - `/redeem_logs` — no public access
  - `/admin` — admin-only via custom claims
  - `/announcements` — admin write, authenticated read

## 13. Security & Performance
- All sensitive operations via Cloudflare Worker (PIN verify, redeem, registration)
- No image URLs stored in Firestore (only encrypted file keys)
- Firebase ID token verification on all Worker requests
- Device fingerprint duplicate detection
- CDN-optimized, ultra-fast loading
- Mobile-first responsive design throughout

