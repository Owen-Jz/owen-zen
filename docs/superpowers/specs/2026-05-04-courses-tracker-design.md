# Courses Tracker — Design Spec

## Overview

A full-featured course tracker page to monitor online courses with overall progress, status filtering, and inline management.

## Layout

- **Page**: `/courses` — standalone page (not a modal/section)
- **Header**: "Courses" title + "Add Course" button (top-right)
- **Filter bar**: Status tabs (All / Watching / Completed / Paused) + Sort dropdown (Newest / Title / Progress)
- **Grid**: Responsive card grid — 3 columns lg, 2 columns md, 1 column sm

## Course Card

- Platform icon/badge — top-left corner
- Course title — bold, max 2 lines, truncated with ellipsis
- URL — clickable external link with small external-link icon
- Progress bar — 0–100% with percentage label
- Status badge — color-coded: watching=blue, completed=green, paused=gray
- Actions — Edit + Delete icon buttons, top-right, visible on hover

## Add/Edit Modal

Fields:
- **Title** — text input, required
- **URL** — text input, optional
- **Platform** — text input, optional
- **Notes** — textarea, optional
- **Progress** — slider 0–100
- **Status** — select: watching / completed / paused

Buttons: Save / Cancel

## API Design

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List all courses, sorted by createdAt desc |
| POST | `/api/courses` | Create course |
| PUT | `/api/courses/[id]` | Update course |
| DELETE | `/api/courses/[id]` | Delete course |

## Filtering & Sorting

All client-side:
- **Status filter**: tabs, instant (no API call)
- **Sort**: Newest (createdAt desc, default) / Title (asc) / Progress (asc)

## Component List

1. `CoursesView` — main page component
2. `CourseCard` — individual course card
3. `CourseModal` — add/edit form modal

## Dependencies

- Existing `Course` model in `src/models/Course.ts`
- Existing API routes in `src/app/api/courses/`
- UI primitives: `button`, `input`, `select`, `dialog`, `slider`, `badge`, `progress`
- Lucide icons: `Plus`, `ExternalLink`, `Edit2`, `Trash2`, `Play`, `Check`, `Pause`

## Out of Scope

- Per-lesson/module tracking — overall progress only
- Course thumbnails beyond URL field
- Bulk actions