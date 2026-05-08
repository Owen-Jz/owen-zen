# Task Bank Design

## Problem
Tasks that are valid but not currently relevant clutter the working board with no home. They need to be stored somewhere retrievable without living in Backlog forever.

## Solution
A new `isBanked` boolean field on tasks and a new "Task Bank" top-level tab. Tasks move to the Bank via an explicit dropdown action, and can be restored to Backlog individually or in bulk.

## Data Model

Add `isBanked?: boolean` to the `Task` interface in `src/types/index.ts`.

No changes to existing fields — `isBanked` is orthogonal to `status`, `isArchived`, and everything else.

Tasks without `isBanked` default to `undefined` (false). No migration needed.

## API Changes

- `PUT /api/tasks/[id]` — accept `{ isBanked: boolean }` in body
- Mongoose model: add `isBanked` to schema with default `false`, add index on `{ isBanked: true }` for fast queries

## UI Changes

### New Top-Level Tab
"Task Bank" tab in the tab bar, positioned between "Tasks" and "Archive".

### Task Bank View (new component)
- Header: "Task Bank" title + task count
- Search/filter bar (same pattern as ArchiveView)
- List of banked tasks — same card rendering as the board
- Each card shows: title, priority indicator, date banked, subtask progress
- Bulk actions toolbar: "Restore to Backlog" + "Delete Permanently"
- Individual task options: Restore, Delete (no "Bank" action since already banked)

### Task Board Dropdown Menu Change
In TaskColumn's dropdown, add:
```
"Move to Bank" — sets isBanked: true, task leaves board
```
Shown only when task is not already banked.

### Archive Tab
No functional change. Archive stays as a clean list of completed tasks only.

## Restore Flow

"Restore to Backlog" on a banked task:
1. `PUT /api/tasks/[id]` with `{ isBanked: false, status: "pending" }`
2. UI removes task from Task Bank view
3. Task reappears in Backlog column

## Interactions Summary

| Action | Trigger | Result |
|---|---|---|
| Move to Bank | Dropdown: "Move to Bank" | Sets `isBanked: true`, task leaves board |
| Restore to Backlog | Task Bank bulk or individual | Sets `isBanked: false, status: "pending"` |
| Delete from Bank | Task Bank bulk or individual | Permanently deletes via `DELETE /api/tasks/[id]` |