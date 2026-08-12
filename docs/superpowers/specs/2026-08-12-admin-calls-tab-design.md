# Admin Calls Tab Design

## Goal

Add a dedicated `Calls` tab to the admin so the sales team can log multiple calls for each lead, track whether each call was answered, and store a remark for every individual call.

## Scope

This change affects the admin experience only.

In scope:

- Add a new top-level `Calls` tab in admin
- Show leads in a call-management view
- Allow multiple call records per lead
- Store each call entry with its own date, answered state, and remark
- Keep calls separate from WhatsApp activity and separate from sales feedback remarks

Out of scope:

- Browser-based telephony or direct calling
- Auto-created call records from phone providers
- Call recordings or durations
- Filters or analytics beyond the initial tab view

## Approved Behavior

The `Calls` tab is a separate main admin tab, not part of the lead activity drawer.

Each lead in the Calls tab will show:

- lead name
- phone number
- source
- request label
- basic lead temperature/context already available in admin
- call history area for that lead
- form to add a new call for that lead

Each lead can have many call records.

## Call Record Fields

Every call record will contain:

- `callDate`: required, date only
- `callStatus`: required dropdown with `Answered` and `Not Answered`
- `remark`: required textarea for that specific call
- `authorName`: existing admin user name
- `authorEmail`: existing admin user email
- timestamps for when the log was saved

The sales team wants the actual call date entered manually, so `callDate` is distinct from the save timestamp.

## UI Behavior

The new Calls tab will be lead-centered rather than a flat call ledger.

Recommended layout:

- one lead card or row per lead
- recent call history shown under that lead
- inline call-log form directly attached to that lead

Behavior:

- a lead with no calls shows `No calls logged yet`
- newest call appears first
- a new saved call appears immediately without page refresh
- the save button is disabled until all required fields are present
- field-level validation appears inline
- calls do not replace or merge with existing `salesRemarks`

## Data Model

Call logs should be stored on the existing lead document as a dedicated array, separate from `salesRemarks`.

Recommended field:

- `callLogs: []`

Each array item stores:

- `callDate`
- `callStatus`
- `remark`
- `authorName`
- `authorEmail`
- created/updated timestamps

This keeps repeated call attempts structured and avoids mixing them with general sales remarks.

## API Design

Keep the existing admin leads API for reading leads, and extend its serialized response to include `callLogs`.

Add a dedicated route for creating new call logs on a lead:

`POST /api/admin/leads/:id/calls`

Request body:

```json
{
  "callDate": "2026-08-12",
  "callStatus": "answered",
  "remark": "Customer answered and asked for a Saturday site visit."
}
```

Response body returns the normalized saved call entry so the client can append it immediately.

## Validation Rules

- `callDate`: required, valid date string
- `callStatus`: required, must be either `answered` or `not_answered`
- `remark`: required, trimmed string, non-empty, max length enforced

Validation must happen in both client UI and API route.

## Compatibility

This feature adds a new call-log track without changing existing lead records, WhatsApp history, or structured sales remarks.

Older leads without `callLogs` should continue to render normally.

## Testing

Verify:

- the new `Calls` tab appears in admin navigation
- leads load correctly in the Calls tab
- a call cannot be saved with missing date, missing status, or empty remark
- multiple call logs can be saved for the same lead
- newest calls appear first
- saved calls persist after reload
- existing lead tabs, WhatsApp activity, and sales feedback remain unaffected
