# Admin Button Pointer Design

## Goal

Make every clickable button inside the admin dashboard show a pointer cursor.

## Approved Approach

Use one scoped CSS rule in the admin styles instead of adding classes button by button.

## Behavior

- Applies only inside `.editorial-admin`
- Affects clickable buttons across sidebar, filters, tables, drawers, leads, and calls
- Excludes disabled buttons so non-clickable controls do not look interactive

## Implementation

Add this selector in the shared admin CSS:

` .editorial-admin button:not(:disabled) `

Set:

- `cursor: pointer`
