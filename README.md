# Aadhya Serene Next.js (Same-to-Same Mirror)

This Next.js app now serves the mirrored original pages and assets as-is for same visual/behavior parity.

## Run
```bash
cd /Users/aasish/.openclaw/workspace/aadhyaserene-next
npm install
npm run dev
```

Open:
- http://localhost:3000/
- http://localhost:3000/about
- http://localhost:3000/apartments
- http://localhost:3000/amenities
- http://localhost:3000/walkthrough
- http://localhost:3000/location
- http://localhost:3000/contact

## Notes
- Routes are rewritten to mirrored `public/*.html` files.
- Assets are served from mirrored `public/_next`, `public/images`, `public/external`.
- Apartments filters run from the original mirrored JS bundles.


## env

SMTP_HOST="sandbox.smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="121fa6c516e293"
SMTP_PASS="51290f3a2ec291"
SMTP_TO="rishav@sthyra.com"
MONGODB_URI="mongodb+srv://rishav_db_user:bcn1rxOhPA3J2nqT@aadhyacluster.2dliczp.mongodb.net/AadhyaSerene?retryWrites=true&w=majority&appName=AadhyaCluster"
JWT_SECRET="aadhya-serene-admin-session-2026-change-before-production"
ADMIN_BOOTSTRAP_SECRET="AADHYA-SERENE-SUPERADMIN-2026"