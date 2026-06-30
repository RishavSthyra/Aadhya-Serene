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

EMAIL_USER="your-google-workspace-or-gmail-address"
GOOGLE_APP_PASSWORD="your-google-app-password"
CONTACT_TO_EMAIL="sales@abhignaconstructions.com"
CONTACT_FROM_EMAIL="your-google-workspace-or-gmail-address"
MONGODB_URI="your-mongodb-uri"
JWT_SECRET="change-before-production"
ADMIN_BOOTSTRAP_SECRET="change-before-production"
