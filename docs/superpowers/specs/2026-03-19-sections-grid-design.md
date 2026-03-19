# Sections Grid Modal — Design Spec

## Overview

A keyboard-triggered modal (Alt+S) that displays all dashboard sections/views in a **5-column grid layout**, allowing quick navigation to any view. Mirrors the sidebar structure and provides a visual overview of all sections at once.

## Trigger & Lifecycle

| Event | Action |
|-------|--------|
| `Alt+S` keypress | Open modal |
| `Escape` keypress | Close modal |
| Click outside modal | Close modal |
| Click card | Navigate to view, close modal |
| `Enter` on focused card | Navigate to view, close modal |

## Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Backdrop: bg-black/60 backdrop-blur-sm]                   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Modal: max-w-4xl, rounded-2xl, shadow-2xl, p-6      │  │
│  │                                                       │  │
│  │  CORE        HEALTH      PLANNING    TOOLS     SYSTEM │  │
│  │  ┌───┐       ┌───┐      ┌───┐      ┌───┐     ┌───┐  │  │
│  │  │ 📊 │       │ 💪 │      │ 🎯 │      │ 📥 │     │ 📌 │  │  │
│  │  │Board│       │Gym │      │Weekly│      │Inbox│     │Watch│  │  │
│  │  └───┘       └───┘      └───┘      └───┘     └───┘  │  │
│  │  ┌───┐       ┌───┐      ┌───┐      ┌───┐     ┌───┐  │  │
│  │  │ 📁 │       │ 🍽️ │      │ 🎨 │      │ 🎯 │     │ 📝 │  │  │
│  │  │Proj│       │Meal│      │Vision│     │Snipe│     │Note│  │  │
│  │  └───┘       └───┘      └───┘      └───┘     └───┘  │  │
│  │  ...        ...        ...       ...       ...     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Responsive Strategy
- **Desktop (lg+):** 5 columns
- **Tablet (md):** 3 columns
- **Mobile:** 2 columns

## Components

### Modal Container
- `fixed inset-0 z-[100]`
- `flex items-center justify-center`
- `bg-surface` with `border border-white/10`
- `rounded-2xl shadow-2xl`
- `p-6` padding
- `max-w-4xl` max-width
- `max-h-[85vh]` with `overflow-y-auto`

### Backdrop
- `fixed inset-0 bg-black/60 backdrop-blur-sm`

### Section Columns
- `flex flex-col gap-4`
- Each column: `flex-1 min-w-0`

### Column Headers
- `text-xs font-bold uppercase tracking-wider text-gray-500 mb-3`

### View Cards
- `bg-white/5 hover:bg-white/10 rounded-xl p-3`
- `flex flex-col items-center gap-2 text-center`
- `transition-all duration-150`
- `hover:ring-2 hover:ring-primary hover:scale-105`
- `focus:ring-2 focus:ring-primary` (keyboard focus)

### Card Content
- Icon: `size-5 text-gray-400`
- Label: `text-xs text-gray-300 truncate w-full`

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move between cards (wraps through all columns) |
| `ArrowUp` | Move to previous card in column |
| `ArrowDown` | Move to next card in column |
| `ArrowLeft` | Move to previous column (same row) |
| `ArrowRight` | Move to next column (same row) |
| `Home` | Jump to first card in current column |
| `End` | Jump to last card in current column |
| `Enter` | Select focused card |
| `Escape` | Close modal |

**Boundary behavior:** Arrow left/right wraps within the same row (first column → last column and vice versa).

## Sections & Views

### Core (6 views)
- Focus Board (LayoutDashboard)
- Project HQ (LayoutTemplate)
- Stats (TrendingUp)
- Habits (Trophy)
- Habit Analytics (BarChart2)
- Discipline Challenge (Shield)

### Health (3 views)
- Gym Tracker (Dumbbell)
- Meal Plan (UtensilsCrossed)
- Food Tracker (Utensils)

### Planning (7 views)
- Weekly Goals (Target)
- Vision Board (Palette)
- Reality Check (Eye)
- 2026 Roadmap (Target)
- 2026 Bucket List (Star)
- Calendar (Calendar)
- Post Bucket (Inbox)

### Tools (5 views)
- The Inbox (Inbox)
- Sniper System (Crosshair)
- Finance Tracker (Wallet)
- Leads CRM (Users)
- Prompt Library (MessageSquare)

### System (4 views)
- Watch Later (Circle)
- Notes (FileText)
- Archive (Archive)
- Settings (Settings)

## Technical Approach

- Create new `SectionsGrid.tsx` component in `/src/components/`
- Reuse existing `linkSections` data structure from `page.tsx`
- Export `useSectionsGrid()` hook similar to `useCommandPalette()`
- Keyboard listener: `Alt+S` (listen for `e.altKey && e.key === 's'`)
- Navigation uses same `setActiveTab()` pattern as CommandPalette
- Animate with Framer Motion (fade + scale entrance, matching CommandPalette)

## Implementation Notes

- Reuse icons already imported in `page.tsx`
- Match exact styling of existing CommandPalette for consistency
- Consider extracting shared modal styles into a common base if useful
