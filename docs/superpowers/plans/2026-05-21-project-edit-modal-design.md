# Project Edit Modal — Command Center Max

**Date:** 2026-05-21
**Status:** Approved
**Author:** Claude

## Overview

A fully redesigned project edit modal that transforms it from a basic form into a true project command center. Four-column layout that surfaces significantly more project context — rich notes, color-coded tags, deliverables, links, metadata — without feeling overwhelming.

## Design Direction

Dark, dense, mission-control aesthetic. Saturated accent colors that pop against the dark surface. Dense but never cluttered — each column has a single clear role.

---

## Layout

**4-column grid at desktop, stacking to single column on mobile.**

| Column 1 | Column 2 | Column 3 | Column 4 |
|---|---|---|---|
| Core fields | Rich notes | Tags & metadata | Deliverables & links |
| ~28% width | ~30% width | ~22% width | ~20% width |

- Modal max-width: `1100px`, full-height (`90vh`), `overflow: hidden` with internal column scroll
- Background: `bg-surface` with `border border-white/10`
- Columns divided by subtle `border-r border-white/5` dividers

---

## Column 1 — Core Fields

- **Title**: Large input, no visible label (the size implies it). Auto-focused. Placeholder: `"Next Gen Platform Rewrite"`.
- **Category + Status + Priority**: Button-group selectors (not dropdowns). Visual badges — icon + text.
  - Category: `development` (blue) / `design` (pink) / `business` (green) / `personal` (purple)
  - Status: `planning` / `active` / `paused` / `completed`
  - Priority: `high` (red) / `medium` (yellow) / `low` (gray)
- **Dates**: Start + Due side by side, native `date` inputs styled to match theme.
- **Progress**: Range slider 0–100 with live `{n}%` badge. Also shows `{done} of {total} deliverables`.
- **Quick tag add**: Mini input at bottom of core section — type and press Enter to quickly add a tag (opens full tag manager).

---

## Column 2 — Rich Notes (Tiptap Editor)

Full Tiptap editor with:

- **Toolbar** (appears on focus):
  - Bold, Italic, Strikethrough
  - H1, H2, H3
  - Bullet list, Numbered list
  - Inline code, Blockquote
  - Link (insert URL on selection)
  - Undo, Redo
  - (All icon-only, compact — tooltips on hover)
- **Min height**: 300px, expands with content
- **Auto-save**: Debounced 1.5s after last keystroke. Shows `"Saved ✓"` / `"Saving..."` indicator in the toolbar.
- **Placeholder**: `"Goals, context, decisions, learnings..."`
- **Markdown shortcuts**: `# ` → H1, `- ` → bullet, `1. ` → numbered, ``` ` ``` → inline code

---

## Column 3 — Tags & Metadata

**Tag Manager:**
- 8 preset color swatches: Red, Orange, Yellow, Green, Teal, Blue, Purple, Pink (saturated, not pastel)
- Click swatch to select color → type tag name → press Enter
- Existing tags rendered as removable chips: colored dot + name + ×
- Click chip to edit (re-color or rename) or delete
- Free-form: custom tags allowed, color-picked at creation

**Metadata fields:**
- **Estimated hours**: Number input with `h` suffix label (e.g. `40h`)
- **Team members**: Comma-separated text input, stored as array
- **Quadrant**: Q1 / Q2 / Q3 / Q4 visual selector — 4 square buttons in a 2×2 grid, matching Eisenhower matrix style (Q1 top-left urgent+important = primary accent)

---

## Column 4 — Deliverables & Links

**Deliverables:**
- Text input + Add button per row
- Each item: checkbox + title + delete button
- Checkboxes toggle `completed` state
- Completing all deliverables triggers a progress bar celebration pulse
- Progress auto-calculated from deliverables count

**Links:**
- Title + URL input pair + Add button
- Rendered as link chips: `icon + title → URL`, opens in new tab
- Delete on hover
- Validates URL format before adding

---

## Header & Footer

**Header:**
- Left: `project ? "Edit Project" : "New Project"` in bold + unsaved changes dot (`●`) when dirty
- Right: `Cancel` (ghost button) + `Save Project` (primary, bold, spinner during submit)

**Footer:**
- `Esc to close` hint in muted text (bottom-right)

---

## Interaction Details

- **Open behavior**: Title input auto-focused, modal animates in (opacity 0→1, scale 0.95→1, y +20→0)
- **Close behavior**: Click backdrop, press Esc, or Cancel button
- **Dirty state**: Unsaved indicator dot appears after any field change
- **Keyboard**: `Cmd/Ctrl + Enter` submits the form
- **Validation**: Title is required (shows red border + shake animation if empty on submit)
- **Error handling**: Toast notification if save fails; form stays open with data preserved

---

## Implementation Notes

### Dependencies
- Add `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`
- Add a color picker library or use a simple inline color swatch grid (no extra dep needed)

### Type Changes (`src/types/index.ts`)
```typescript
// Add to Project interface:
tags?: ProjectTag[];       // new
estimatedHours?: number;  // new
teamMembers?: string[];   // new
quadrant?: "q1" | "q2" | "q3" | "q4" | null; // new
notesRichText?: string;   // new — stores Tiptap HTML

export interface ProjectTag {
  name: string;
  color: string; // hex e.g. "#ef4444"
}
```

### API Changes (`POST /api/projects`, `PUT /api/projects/[id]`)
- Accept and store `tags`, `estimatedHours`, `teamMembers`, `quadrant`, `notesRichText` fields
- `notes` field (string array) is deprecated but keep for backward compat — merge `notesRichText` into it as first note or keep separate

### Auto-save
- Use a `useEffect` with 1.5s debounce on the editor content
- Only trigger on actual content change (not on every render)
- Store dirty flag in local state; reset on successful save

### Milestones
- **Stretch goal** — not in scope for v1