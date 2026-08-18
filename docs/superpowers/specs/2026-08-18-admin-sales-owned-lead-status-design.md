# Admin Sales-Owned Lead Status Design

## Goal

Shift admin lead temperature ownership from WhatsApp activity to the sales team, with lead status managed only from the `Calls` tab while keeping `View lead activity` focused on WhatsApp journey context.

## Scope

This change affects the admin `Leads` tab, admin `Calls` tab, existing call-log save flow, and the lead activity drawer.

In scope:

- Add a sales-owned lead status with default `cold`
- Stop using WhatsApp-derived temperature as the main lead badge/filter in admin
- Add `lead status` to the `Calls` tab save flow
- Move all sales feedback entry to the `Calls` tab only
- Keep WhatsApp activity, callback, and site-visit signals visible in the activity drawer
- Add a compact requirements capture flow in the `Calls` tab
- Keep lead partners read-only in calls while still allowing them to view the calls area

Out of scope:

- Any automatic telephony integrations
- Re-introducing sales remark editing in the lead activity drawer
- Separate status systems for WhatsApp and sales
- Changes to public lead capture forms

## Approved Behavior

Sales owns the main admin lead status going forward.

Behavior:

- Every lead defaults to `cold`
- The sales status is updated only from the `Calls` tab while saving a call
- Allowed status values are `cold`, `warm`, `hot`, and `dead`
- The latest saved sales status becomes the single source of truth for lead status in admin
- Existing `Cold / Warm / Hot / Dead` filters in admin use this sales-owned status
- WhatsApp activity no longer determines the main lead temperature badge or lead filters

## Roles And Permissions

- `super_admin` and `manager` can save calls and set the sales lead status
- `lead_partner` can view the `Calls` tab, call history, WhatsApp activity, callback/site-visit chips, and current lead status
- `lead_partner` cannot save call updates or edit lead status

## Calls Tab Form

Keep the existing call logging flow, but expand it into the single place where sales updates both lead status and sales feedback.

The form will contain:

- `callDate`
- `callStatus`
- `leadStatus`
- `remark`
- a compact toggle such as `Customer shared requirements`

When the requirements toggle is enabled, show these fields:

- `budget`
- `configuration`
- `location`

Field behavior:

- `leadStatus` is required for `super_admin` and `manager`
- `budget`, `configuration`, and `location` must each support `Not mentioned`
- if all three requirement fields are `Not mentioned`, the requirements UI should collapse/reset back to the hidden state

## Requirements Capture

The requirements section should be smaller, clearer, and easier for the sales team to scan than the current structured feedback form.

Recommended interaction:

- checkbox or toggle to indicate the customer shared requirements
- when enabled, reveal the three requirement fields only
- no extra long-form sales form in this section beyond the existing call remark

This keeps the call form lightweight while still capturing the sales signals the team needs.

## Lead Activity Drawer

`View lead activity` should become a WhatsApp-only context drawer.

Keep:

- WhatsApp journey/activity timeline
- callback chip when requested
- site-visit chip when requested

Remove:

- sales remark history
- sales remark form
- any sales feedback editing

This drawer should help the sales team understand the WhatsApp conversation, not act as a second place to manage sales notes.

## Data Model

Add a dedicated sales-owned status field to the lead record.

Recommended field:

- `salesLeadStatus`

Allowed values:

- `cold`
- `warm`
- `hot`
- `dead`

Behavior:

- existing leads without the field should be treated as `cold`
- new leads should default to `cold`
- this field replaces the old admin use of WhatsApp temperature for badges and filters

The existing `salesRemarks` storage should remain available for call-side feedback summaries, but editing and display should live only in the `Calls` tab.

## API Changes

The existing call-save route remains the write point for call logging:

`POST /api/admin/leads/:id/calls`

Request body expands to include sales-owned status and optional requirements:

```json
{
  "callDate": "2026-08-18",
  "callStatus": "answered",
  "leadStatus": "warm",
  "remark": "Customer requested a Saturday callback.",
  "sharedRequirements": true,
  "budget": "99L - 1.4 Cr",
  "configuration": "2 BHK",
  "location": "Not mentioned"
}
```

Server behavior:

- validate call fields
- validate `leadStatus`
- normalize requirements fields
- treat all-three-`Not mentioned` as effectively not shared
- save the call log
- update the lead record’s current `salesLeadStatus`
- return the saved call entry and updated status for immediate UI refresh

## Validation Rules

- `callDate`: required, valid date
- `callStatus`: required, valid option
- `leadStatus`: required for users allowed to write calls, must be one of `cold`, `warm`, `hot`, `dead`
- `remark`: required, trimmed, non-empty
- `budget`: optional when requirements are hidden, otherwise valid option including `Not mentioned`
- `configuration`: optional when requirements are hidden, otherwise valid option including `Not mentioned`
- `location`: optional when requirements are hidden, otherwise valid option including `Not mentioned`

Validation should happen on both the client and the API route.

## UI Filtering And Display

In both `Leads` and `Calls` tabs:

- badge text should come from `salesLeadStatus`
- filter counts should come from `salesLeadStatus`
- dead leads should be handled through this same field instead of a separate temperature/dead split

On lead cards:

- show the sales-owned status badge
- keep existing callback and site-visit chips
- keep `View lead activity`

## Compatibility

Historical lead records may not yet contain `salesLeadStatus`.

Compatibility behavior:

- render them as `cold`
- allow the next saved call to set the new status explicitly
- continue showing WhatsApp activity without using it for main lead temperature

This allows a smooth transition without breaking current lead records.

## Testing

Verify:

- existing leads render as `cold` by default
- `super_admin` and `manager` can save a call with `leadStatus`
- saving a call updates both call history and the lead’s current status
- `lead_partner` can open the `Calls` tab but cannot edit the form
- `View lead activity` still shows WhatsApp flow, callback, and site-visit chips
- sales remarks no longer appear in the activity drawer
- requirement fields appear only when toggled on
- all-three `Not mentioned` collapses or resets the requirements section cleanly
- `Leads` and `Calls` tab filters both use the sales-owned status values
