# Sales Executive Round-Robin Lead Assignment Design

## Goal

Automatically assign every new incoming lead to a `sales_executive` in near-equal round-robin order, while keeping super admin visibility across all leads and making the assignee visible in lead details and exports.

## Scope

This change affects new lead creation, admin lead access rules, the lead details sidebar, and lead/call CSV exports.

In scope:

- assign only new leads created after this feature goes live
- distribute new leads across active `sales_executive` accounts in persistent round-robin order
- ensure `sales_executive` users only see leads assigned to themselves
- keep `super_admin` visibility across all leads
- show assignee details in the lead sidebar opened from the lead name
- include assignee details in exported lead and call reports
- preserve unassigned leads safely if no active sales executive is available

Out of scope:

- rebalancing old existing leads
- manually reassigning leads in this same change
- changing the current sales-owned lead status workflow
- changing lead partner source-scoped visibility

## Approved Behavior

- Only new leads are auto-assigned.
- Existing historical leads stay as they are today.
- Lead distribution happens across all active `sales_executive` accounts together, not separated by source or channel.
- With 2 active sales executives, assignment stays near 50/50 over time.
- With 3 active sales executives, assignment rotates across all 3 in order.
- If no active sales executive exists at assignment time, the lead is still saved and marked `unassigned`.
- A lead must never be dropped because assignment could not be completed.

## Roles And Visibility

### Super Admin

- can see all leads together
- can open the lead sidebar and see who the lead is assigned to
- can export reports containing assignee details

### Sales Executive

- can see only leads assigned to their own admin account
- can continue using the existing leads and calls workflow for those assigned leads
- cannot see leads assigned to another sales executive

### Manager

Managers keep the current broad admin visibility unless changed in a later feature. This design does not narrow manager access.

### Lead Partner

Lead partners keep the current source-scoped visibility. This feature does not re-scope their access around sales assignment.

## Assignment Model

Use a persistent round-robin selector.

Recommended approach:

- maintain a single assignment sequence record in MongoDB
- on each new lead, load the current active `sales_executive` users
- sort the eligible users in a stable order
- increment the shared sequence atomically
- assign the lead to `eligibleUsers[sequence % eligibleUsers.length]`

Stable ordering should be explicit and deterministic. Recommended order:

- `createdAt` ascending
- tie-break by `_id` ascending

This keeps assignment predictable and avoids drift caused by random query ordering.

## Safety And No-Loss Guarantee

This feature must be designed so a lead is never lost.

Safe behavior:

- the lead record must always be saved even if assignment cannot be completed
- if no active sales executive exists, save the lead as `unassigned`
- if assignment lookup fails unexpectedly, save the lead as `unassigned`
- super admin must still be able to see unassigned leads

Assignment failure must not block lead creation.

## Data Model

Add these fields to each lead record:

- `assignedSalesExecutiveId`
- `assignedSalesExecutiveName`
- `assignedSalesExecutiveEmail`
- `assignmentStatus`
- `assignedAt`

Recommended `assignmentStatus` values:

- `assigned`
- `unassigned`

Add one small collection or singleton document for the persistent round-robin cursor:

- `scope`
- `nextSequence`
- `updatedAt`

Recommended singleton scope value:

- `sales_executive_round_robin`

## Lead Creation Flow

This feature should hook into the shared lead creation path used by:

- website contact submissions
- WhatsApp-form lead creation
- portal/external lead creation

Flow:

1. determine the current eligible active `sales_executive` users
2. if one or more exist, atomically increment the round-robin sequence
3. choose the assignee from the ordered user list
4. create the lead with assignee fields already saved on the lead record
5. if no eligible sales executive exists, create the lead as `unassigned`

The lead creation path should not need a second repair pass to become visible. The created lead should already contain either a real assignee or `unassigned`.

## Admin Access Filtering

Update admin lead scope rules:

- `sales_executive` queries must be filtered to `assignedSalesExecutiveId === currentUser.id`
- `super_admin` continues to query all leads
- `manager` continues to query all leads
- `lead_partner` keeps the existing source-based query filter

This same scoping should apply consistently to:

- leads tab
- calls tab
- lead export
- call export

## Lead Sidebar

When super admin clicks the lead name and opens the sidebar, show assignment information there.

Add an assignment section to the existing lead details sidebar:

- `Assigned to: <sales executive name>`
- `Email: <sales executive email>`
- `Status: Assigned` or `Unassigned`
- `Assigned at: <date/time>` when available

For unassigned leads:

- show `Assigned to: Unassigned`
- hide empty email
- show `Status: Unassigned`

This information should live in the sidebar only, not in the main lead table/card listing.

## Exports

Add assignee details to lead and call reports.

Recommended columns:

- `Assigned Sales Executive`
- `Assigned Sales Executive Email`
- `Assignment Status`

For old leads without assignment data:

- export `Unassigned`

For new assigned leads:

- export the saved assignee values from the lead record

## Compatibility

Historical leads will not have assignment fields.

Compatibility behavior:

- old leads remain readable
- old leads are treated as `unassigned` for sidebar/export display unless assignment data exists
- old leads are not redistributed automatically

This keeps rollout low-risk and honors the approved `only new leads` decision.

## Validation And Edge Cases

- only `active` admin users with role `sales_executive` are eligible assignees
- inactive sales executives are skipped for future assignment
- if a new sales executive is added, they join the rotation on future leads only
- if a sales executive is deactivated, their existing assigned leads stay with them unless a future reassignment feature is added
- if the eligible list is empty, assignment status becomes `unassigned`

## Testing

Verify:

- new leads are assigned in alternating order with 2 active sales executives
- new leads are distributed evenly across 3 active sales executives
- assignment persists on the lead record
- `sales_executive` A cannot see leads assigned to `sales_executive` B
- super admin can see all leads together
- lead sidebar shows assignee details correctly for assigned leads
- lead sidebar shows `Unassigned` correctly when no assignee exists
- lead and call CSV exports include assignee columns
- lead creation still succeeds if no active sales executive exists
- historical leads remain visible and do not break serialization
