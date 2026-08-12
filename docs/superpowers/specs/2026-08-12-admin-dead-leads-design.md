# Admin Dead Leads Design

## Goal

Add a reversible `Dead` lead workflow to admin so sales can move leads in and out of a dead-lead bucket from both the `Leads` tab and the `Calls` tab.

## Approved Behavior

- Add a new `Dead` filter beside `Cold`, `Warm`, and `Hot`
- Style the `Dead` filter with a red active state and white text
- Add a per-lead toggle button in both `Leads` and `Calls`
- Toggling a lead to dead moves it into the `Dead` bucket immediately
- Toggling a dead lead again restores it to active and returns it to its temperature-based bucket

## Data Model

Store dead-lead state directly on the lead document.

- `leadStatus: "active" | "dead"`

Default for existing and new leads is `active`.

Temperature scoring remains unchanged. `Dead` is a separate lifecycle state layered on top of temperature.

## UI Behavior

### Leads Tab

- Keep the existing temperature filters
- Add `Dead` as an additional filter option
- `Cold`, `Warm`, and `Hot` show only active leads
- `Dead` shows only leads whose `leadStatus` is `dead`
- Each lead row/card gets a toggle button:
  - active lead: `Mark dead`
  - dead lead: `Restore lead`

### Calls Tab

- Add the same filter bar so sales can review call activity for dead leads too
- Use the same filtering rules as the Leads tab
- Add the same toggle button on each lead card

## API Design

Extend serialized lead payloads to include `leadStatus`.

Add a dedicated admin route:

`PATCH /api/admin/leads/:id/status`

Request body:

```json
{
  "leadStatus": "dead"
}
```

The route returns the updated lead status so the client can update immediately without a reload.

## Validation

- `leadStatus` is required
- allowed values: `active`, `dead`
- only write-capable admin roles can change it

## Compatibility

- Existing leads without `leadStatus` behave as `active`
- No change to WhatsApp scoring, call logs, or sales remarks

## Testing

Verify:

- `Dead` filter appears in both `Leads` and `Calls`
- toggling from active to dead moves the lead out of active filters immediately
- toggling from dead to active restores the lead immediately
- dead-lead state persists after refresh
- non-write users cannot change dead-lead status
