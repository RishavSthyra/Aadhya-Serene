# Enquiry Validation Design

## Goal

Add strict, shared validation for every public enquiry form in the Aadhya Serene site and enforce the same rules on the server. The UX should block invalid submissions, surface field-level errors clearly, and prevent malformed payloads from reaching email, database, or WhatsApp delivery logic.

## Scope

This work covers:

- `components/Contact/index.jsx`
- `components/ReadyToMoveLandingPage/EnquiryContactPage.jsx`
- `components/ReadyToMoveLandingPage/index.jsx`
- `components/ReadyToMoveLandingPage/PopupLeadRoute.jsx`
- `components/WhatsAppLeadForm.tsx`
- `app/api/contact/route.js`
- `app/api/whatsapp/start/route.ts`

## Approach

Use one shared Zod validation module for both client and server. The module will expose:

- reusable field schemas
- form-specific schemas
- input sanitizers for strict typing behavior
- helpers that convert Zod issues into field-error maps for UI and API responses

Client forms will validate on change, on blur, and on submit. Invalid fields will show inline errors and submission will be blocked until the payload is valid. Server routes will parse incoming JSON with the same schemas and return structured field errors when validation fails.

## Validation Rules

- `name`: required, trimmed, 2-80 chars, letters/numbers/common punctuation only
- `phone`: required, normalized to valid Indian mobile format
- `email`: required for contact forms that already require it; optional nowhere else; valid email format
- `requestType`: must match allowed request types
- `residenceType`: must match allowed residence options where present
- `config`: must match allowed landing-page configuration options
- `budget`: must match allowed landing-page budget options
- `preferredTime`: optional, trimmed, max length enforced
- `message`: optional, trimmed, max length enforced, whitespace-only treated as empty
- `projectName` and `source`: validated and trimmed on WhatsApp/contact API payloads

## Client UX

- Phone input will sanitize aggressively while typing.
- Text inputs will trim for validation and reject clearly invalid values.
- Select fields must always remain within known option sets.
- Each form will show per-field error messages near the input.
- Existing success states, redirects, and submission flows stay unchanged.

## Server Behavior

- `/api/contact` validates before any record creation or email sending.
- `/api/whatsapp/start` validates before phone normalization side effects or delivery calls.
- Validation failures return `400` with:
  - `error`
  - `fieldErrors`

## Testing

- install `zod`
- run targeted static checks across updated files
- manually verify representative valid and invalid payloads for both APIs

## Notes

This design intentionally avoids a large form-library migration. The current controlled inputs stay in place, and a small shared validation helper layer is introduced around them.
