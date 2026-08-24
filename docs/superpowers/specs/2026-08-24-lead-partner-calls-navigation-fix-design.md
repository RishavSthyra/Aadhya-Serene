# Lead Partner Calls Navigation Fix

## Problem

Lead partners are allowed to use the Leads and Calls sections, but the current navigation effect resets every lead-partner section change to Leads. As a result, selecting Calls immediately returns the account to Leads and prevents call history from rendering.

## Design

Keep the existing lead-partner navigation and data permissions. Change only the client-side section guard so that:

- `leads` remains available.
- `calls` remains available.
- Any other section redirects a lead partner to `leads`.
- Sales executive and internal-admin navigation behavior remains unchanged.

The Calls panel remains read-only for lead partners because write access continues to be controlled by the existing `canWrite` role check.

## Verification

- Confirm a lead partner lands on Leads after login.
- Confirm selecting Calls keeps Calls active and renders source-scoped leads with their call histories.
- Confirm selecting Leads returns to Leads.
- Confirm the production build succeeds.
