# Admin Structured Feedback Design

## Goal

Replace the plain sales-remark textarea in the admin lead activity sidebar with a structured feedback form so sales can capture cleaner follow-up data for each lead.

## Scope

This change affects only the admin lead activity sidebar and the existing lead remarks API/storage path.

In scope:

- Replace the current single remark textarea with a structured form
- Store each remark as structured data in `salesRemarks`
- Keep existing author and timestamp behavior
- Render saved structured feedback clearly in the sidebar

Out of scope:

- New collections or separate feedback tables
- Lead filtering/reporting based on the new fields
- Changes to non-admin lead forms

## Approved Inputs

The new feedback form will contain:

- `budget`: required dropdown using the existing landing budget ranges already used in the project
- `configuration`: required dropdown with only `2 BHK` and `3 BHK`
- `location`: required plain text input with no suggestions or autocomplete dataset
- `notes`: optional textarea for call outcome, objections, follow-up details, or context

## UI Behavior

The structured form will replace the current `Add calling remark` textarea inside the existing `Sales remarks` section in the lead activity drawer.

Behavior:

- The save button remains disabled until `budget`, `configuration`, and `location` are filled
- Field-level validation errors appear inline under the corresponding field
- On successful save, the new entry appears immediately in the existing remarks list without a full refresh
- After successful save, the form resets to blank values
- The overall drawer layout and interaction model remain unchanged

## Saved Feedback Display

Each saved remark entry will render as a structured feedback card within the existing remarks history.

Display order:

1. A compact metadata line such as `2 BHK · 99L - 1.4 Cr · Thanisandra`
2. Optional notes block, only when notes exist
3. Existing author name and saved timestamp

This keeps the timeline readable while surfacing the key sales fields first.

## Data Model

The change will continue using the existing `Notification.salesRemarks` array.

Each remark object will be extended to store:

- `budget`
- `configuration`
- `location`
- `notes`
- existing `authorName`
- existing `authorEmail`
- existing timestamps

The existing `text` field will remain and be generated on the server from the structured values. This preserves compatibility with any current code paths, exports, or assumptions that still expect a plain text summary.

Example generated text:

`Configuration: 2 BHK | Budget: 99L - 1.4 Cr | Location: Thanisandra | Notes: Requested weekend callback.`

## API Changes

The existing admin remarks endpoint will keep the same route:

`POST /api/admin/leads/:id/remarks`

Request body will change from:

```json
{
  "text": "Call outcome, customer requirement, follow-up details..."
}
```

to:

```json
{
  "budget": "99L - 1.4 Cr",
  "configuration": "2 BHK",
  "location": "Thanisandra",
  "notes": "Requested weekend callback."
}
```

Server behavior:

- Validate required fields
- Normalize trimmed values
- Build the derived `text` summary server-side
- Save the structured remark object in `salesRemarks`
- Return the saved remark in normalized form for immediate client rendering

## Validation Rules

- `budget`: required, must match the existing approved budget options
- `configuration`: required, must be either `2 BHK` or `3 BHK`
- `location`: required, trimmed string, non-empty, reasonable max length
- `notes`: optional, trimmed string, reasonable max length

Validation should happen on both the client and the API route.

## Compatibility

Existing remarks without structured fields may still exist in the database. The admin UI should continue rendering them gracefully by falling back to the old `text` presentation when the new structured fields are missing.

This avoids breaking historical data and allows a gradual transition.

## Testing

Verify:

- Required fields block save when missing
- A valid structured feedback entry saves successfully
- The saved entry appears immediately in the sidebar
- Old plain-text remarks still render correctly
- The API rejects invalid budget/configuration values
- Author and timestamp behavior remain unchanged
