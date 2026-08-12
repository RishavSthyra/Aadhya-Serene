# Admin Phone Grouping Design

## Goal

Treat phone number as the parent lead identity in admin so multiple submissions from the same number appear as one grouped lead.

## Approved Behavior

- One admin lead row per phone number
- Latest name is shown as the main lead name
- Past names remain visible as aliases
- All enquiry sources for that phone remain visible
- All submissions, call logs, sales remarks, and activity appear as one combined phone-level history

## Scope

This change affects the admin read model and the admin grouped-lead actions.

In scope:

- Group admin leads by phone number
- Merge submission history for the same phone
- Merge sales remarks and call logs for the same phone
- Merge activity timeline for the same phone
- Show past names and all sources in admin
- Keep one dead-lead status per phone in admin behavior

Out of scope:

- Public form deduplication changes
- Migrating existing Mongo records into a new collection
- Introducing a new permanent `Contact` model

## Data Model Strategy

Keep the existing `Notification` documents unchanged.

Admin will build a grouped lead view on read:

- parent key: `phone`
- child records: all `Notification` documents with that phone in the current query scope

This avoids risky migration while still giving sales one unified lead view.

## Grouped Lead Shape

Each grouped admin lead should contain:

- `id`: latest notification id for action routing
- `phone`
- `name`: latest submission name
- `names`: unique names seen for that phone
- `source`: latest source
- `sources`: unique sources seen for that phone
- `channel`: latest channel
- `channels`: unique channels seen for that phone
- `email`: latest non-empty email if available
- `requestLabel`, `requestType`, `preferredTime`, `message`: from the latest submission
- `leadStatus`: normalized phone-level status
- `submissions`: all underlying submissions, newest first
- `salesRemarks`: merged newest-first list across submissions
- `callLogs`: merged newest-first list across submissions
- `activity`: merged timeline across submissions plus phone-level WhatsApp conversation events
- latest delivery status fields for the latest submission
- earliest and latest timestamps useful for display

## Activity Rules

Activity should be combined across all submissions for the phone.

The grouped timeline should include:

- every submission received event
- delivery events from each submission
- persisted submission activity from each submission
- WhatsApp conversation history once for the phone, not duplicated per submission

## Write Behavior

Grouped admin rows still use the latest notification id for remark/call actions.

- new sales remark: saved to the latest notification for that phone
- new call log: saved to the latest notification for that phone
- dead/restore toggle: updates all notifications for that phone

This keeps write complexity low while presenting one combined phone-level history.

## UI Behavior

### Leads Tab

- Show one row/card per phone
- Show latest name prominently
- Show aliases when the phone has multiple names
- Show all sources for that phone
- Show one `View lead activity` entry point for the grouped lead

### Lead Activity Drawer

- Show grouped lead header for the phone
- Show combined sales remarks
- Show combined activity
- Add a submissions section listing all underlying enquiries

### Calls Tab

- Show one lead card per phone
- Show latest name, aliases, and sources
- Show combined call history
- Saving a new call updates the combined phone-level history immediately

## API Design

Keep `GET /api/admin/leads`, but change its response from raw notifications to grouped leads.

Keep existing admin remark/call routes by latest notification id.

Update `PATCH /api/admin/leads/:id/status` so it resolves the phone from the notification id and updates every notification with that phone.

## Compatibility

- Existing Mongo records remain valid
- Older lead rows collapse into grouped phone leads automatically
- WhatsApp score remains phone-based, which now matches the grouped admin view

## Testing

Verify:

- same phone with different names appears as one lead row
- same phone with website and WhatsApp submissions appears as one lead row
- aliases and sources are visible
- combined call logs and sales remarks include entries from all submissions
- grouped activity includes all submissions plus one phone-level WhatsApp conversation history
- dead/restore updates the whole phone group
- saving a new call or remark still works from the grouped view
