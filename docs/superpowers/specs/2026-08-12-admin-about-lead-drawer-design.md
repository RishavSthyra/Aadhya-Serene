# Admin About Lead Drawer Design

## Goal

Reduce clutter in grouped phone leads by moving grouped metadata into a separate `About lead` drawer.

## Approved Behavior

- Lead name becomes clickable in admin
- Clicking the name opens a separate `About lead` drawer
- The main leads list and calls cards stay compact
- Grouped metadata no longer dumps inline in the list

## Drawer Contents

The `About lead` drawer contains:

- all past names
- all sources
- all channels
- submission count
- submission history
- latest contact basics such as phone and email

## Scope

- Applies to grouped lead rows/cards in `Leads` and `Calls`
- Does not replace the existing `View lead activity` drawer
- Keeps activity, remarks, and call logs in the existing activity drawer

## UI Behavior

- Clicking the lead name opens the `About lead` drawer
- The drawer is read-focused and shows grouped metadata cleanly
- The list/card keeps only the summary needed for scanning
