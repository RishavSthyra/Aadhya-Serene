# Lead Activity Timeline and Sales Remarks

## Goal

Give sales users a detailed, chronological view of each lead without making the lead list cluttered. External source partners retain read-only visibility into their own leads only.

## Detail sidebar

Opening a lead shows:

1. Sales remarks at the top, if any. Super Admins and Managers can add a timestamped remark; partner accounts can read but cannot add one.
2. A chronological activity timeline below the remarks.

## Timeline events

The timeline combines persisted lead delivery state and WhatsApp conversation history:

- lead received from its source;
- initial sales email sent or failed;
- WhatsApp welcome template sent or failed;
- bot messages/documents sent;
- each customer quick-reply selection;
- callback/site-visit notification email sent to sales.

All events are rendered in India time. Existing leads receive the events that can be derived from their stored delivery and conversation records. Future callback/site-visit notification events are persisted on the lead so they appear precisely in the timeline.

## Access control

The existing source filter remains authoritative. Lead partner accounts can only read their source's lead detail and export, and cannot write sales remarks. Super Admins and Managers can add remarks.
