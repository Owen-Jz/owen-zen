# Investment Planning — Design Spec

**Date:** 2026-05-29
**Owner:** Owen
**Status:** Approved, ready for implementation planning

## 1. Purpose

A planning-first investment management section inside Owen Zen. The goal is not portfolio tracking against live market data; it is **strategically planning investments from idea to execution** — researching opportunities, deciding what to fund, scheduling action, capturing reasoning, and reviewing progress.

Active investments get lightweight status tracking (`active`, `completed`) but no live prices, no broker integration, no real PnL.

## 2. Locked-in Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Scope | Planning-first | Matches brief ("plan from idea stage to execution"); avoids broker/API integration overhead |
| Currency | NGN base + USD subtext | Matches existing Subscription module pattern; single user-editable FX rate |
| Finance integration | Linked but separate | Optional one-click "log as expense" toast; no automatic writes |
| Layout | Overview dashboard + sub-tabs | Premium fintech feel; tabs: Overview, Investments, Goals, Calendar, Research |
| Reminders | In-app via existing Notification model | Reuses NotificationBell; no external services |
| Goals | Dedicated `InvestmentGoal` model | Keeps domain boundary clean from existing life-goal `Goal` model |
| Attachments | External URLs only | Zero storage cost; matches existing Project links pattern |
| Risk field | Yes — separate from Priority | Priority = how much I want it; Risk = how dangerous it is |
| Categories | Fixed enum + free-form tags | Predictable filtering with flexibility |
| Charts | Recharts | Idiomatic with Next.js + Framer Motion + Tailwind stack |

## 3. Data Model

All models live in `src/models/` and follow the existing pattern:
```ts
export default mongoose.models.X || mongoose.model('X', XSchema);
```
All route handlers call `dbConnect()` before any database operation and return `{ success, data | error }`.

### 3.1 `Investment.ts`

```
title              String, required
description        String
thesis             String              // rich text / Tiptap markup — "why I'm doing this"
category           enum [
                     'stocks','crypto','real-estate','startups','business',
                     'savings','bonds','etf','commodities','other'
                   ]
tags               [{ name: String, color: String }]
status             enum ['researching','planned','in-progress','active','completed','cancelled']
                   default 'researching'
priority           enum ['p0','p1','p2','p3'], default 'p2'
risk               enum ['low','medium','high','speculative'], default 'medium'
budgetNGN          Number              // planned allocation in base currency
expectedReturnPct  Number              // expected ROI percentage
expectedExitDate   String (YYYY-MM-DD) // target horizon
startDate          String (YYYY-MM-DD)
endDate            String (YYYY-MM-DD)
progress           Number 0–100, default 0
progressManuallySet Boolean, default false  // when true, milestone-driven auto-recompute is suppressed
milestones         [{
                     title: String,
                     dueDate: String (YYYY-MM-DD),
                     amountNGN: Number (optional),
                     completed: Boolean (default false),
                     completedAt: Date
                   }]
links              [{ title: String, url: String,
                     kind: enum ['doc','article','broker','tweet','other'] }]
notes              String              // rich text / Tiptap markup
reminderIds        [ObjectId → InvestmentReminder]
goalIds            [ObjectId → InvestmentGoal]
isArchived         Boolean, default false
archivedAt         Date
createdAt          Date, default Date.now
updatedAt          Date
```

### 3.2 `InvestmentGoal.ts`

```
title                String, required
description          String
targetAmountNGN      Number, required
currentAmountNGN     Number, default 0   // cached, recomputed nightly + on linked changes
targetDate           String (YYYY-MM-DD)
horizon              enum ['short','long'], default 'short'   // <2y vs ≥2y
linkedInvestmentIds  [ObjectId → Investment]
status               enum ['on-track','at-risk','achieved','paused'], default 'on-track'
progress             Number 0–100, default 0
createdAt            Date, default Date.now
```

### 3.3 `InvestmentReminder.ts`

```
investmentId           ObjectId → Investment, required
title                  String, required
dueAt                  Date, required
kind                   enum ['review','fund','rebalance','exit','custom']
                       default 'custom'
recurrence             enum ['none','weekly','monthly','quarterly'], default 'none'
triggered              Boolean, default false
triggeredAt            Date
dismissedAt            Date
linkedNotificationId   ObjectId → Notification   // row created in existing model
createdAt              Date, default Date.now
```

### 3.4 `InvestmentSettings.ts`

A single document per user (we are single-user, so a singleton works):
```
usdToNgnRate           Number, required
displayCurrency        enum ['NGN','USD'], default 'NGN'
updatedAt              Date
```

## 4. API Surface

All routes under `src/app/api/investments/`:

```
investments/
  route.ts                          GET (paginated, filterable), POST
    Query params: status, category, risk, priority, tag, page, limit
  [id]/route.ts                     GET, PUT, DELETE
  [id]/milestones/route.ts          POST (add), PUT (toggle/edit)
  [id]/archive/route.ts             PUT
  stats/route.ts                    GET — aggregations for Overview
  search/route.ts                   GET — text search title/notes/tags
  calendar/route.ts                 GET — events for CalendarTab
goals/
  route.ts                          GET, POST
  [id]/route.ts                     GET, PUT, DELETE
reminders/
  route.ts                          GET, POST
  [id]/route.ts                     GET, PUT, DELETE
  [id]/dismiss/route.ts             POST
  due/route.ts                      GET — surfaces due reminders, writes Notification rows
settings/
  route.ts                          GET, PUT
```

`stats/route.ts` returns:
```
{
  totals: { plannedNGN, activeCount, completedCount, expectedReturnPctAvg },
  byCategory: [{ category, plannedNGN, count }],
  byRisk:     [{ risk, plannedNGN, count }],
  byStatus:   [{ status, count }],
  upcomingReminders: [...],
  recentActivity:    [...]    // last 10 status changes / milestones
}
```

## 5. UI Structure

### 5.1 Sidebar entry

Add to existing `linkSections` in `src/app/page.tsx`, **Tools** section:
```
{ id: "investments", label: "Investment Planning", icon: TrendingUp }
```
Lazy-loaded via `dynamic()`, matching every existing view.

### 5.2 Component tree

All under `src/components/investments/`:

```
InvestmentPlanningView.tsx        ← shell, owns active sub-tab + global filters
├── InvestmentHeader.tsx          ← title, "+ New Investment", currency toggle
├── InvestmentTabs.tsx            ← [Overview] [Investments] [Goals] [Calendar] [Research]
│
├── tabs/
│   ├── OverviewTab.tsx
│   │   ├── SummaryCards.tsx              ← Total Planned, Active, Expected ROI, Upcoming
│   │   ├── AllocationDonut.tsx           ← Recharts donut; toggle category ↔ risk
│   │   ├── PortfolioProgressBar.tsx      ← stacked bar by status
│   │   ├── UpcomingRemindersList.tsx     ← next 7 days
│   │   └── RecentActivityFeed.tsx
│   │
│   ├── InvestmentsTab.tsx
│   │   ├── InvestmentFilters.tsx         ← status, category, risk, priority, tag chips
│   │   ├── InvestmentListView.tsx        ← default: card list
│   │   ├── InvestmentBoardView.tsx       ← optional kanban by status
│   │   └── InvestmentCard.tsx            ← shared by both
│   │
│   ├── GoalsTab.tsx
│   │   ├── GoalCard.tsx
│   │   └── GoalProgressChart.tsx
│   │
│   ├── CalendarTab.tsx                   ← scoped to investment events
│   └── ResearchTab.tsx                   ← cross-investment notes index, searchable
│
├── modals/
│   ├── InvestmentFormModal.tsx           ← multi-step: Basics → Money → Plan → Notes
│   ├── InvestmentDetailDrawer.tsx
│   │   ├── DetailHeader.tsx
│   │   ├── DetailBudgetPanel.tsx
│   │   ├── MilestonesPanel.tsx
│   │   ├── LinksAndDocsPanel.tsx
│   │   ├── RemindersPanel.tsx
│   │   └── NotesEditor.tsx               ← Tiptap, same setup as ProjectView
│   ├── GoalFormModal.tsx
│   └── ReminderFormModal.tsx
│
└── shared/
    ├── CurrencyAmount.tsx                ← renders ₦X with $Y subtext
    ├── StatusPill.tsx
    ├── RiskPill.tsx
    ├── PriorityDot.tsx
    └── useInvestmentFXRate.ts            ← React Query hook
```

### 5.3 State & data flow

- **React Query** for all server state (matches existing stack)
- **`InvestmentContext`** for active filter set + display currency, to avoid prop-drilling
- **Optimistic updates** on status changes, milestone toggles, reminder dismissals (same pattern as task views)
- **Mobile**:
  - Tabs become horizontal-scroll bar
  - Donut chart stacks above upcoming list
  - Detail drawer becomes full-screen overlay below the `md` breakpoint
  - Cards reflow to single column

### 5.4 Visual style

- Reuse existing theme tokens (`bg-surface`, `border-border`, `text-primary`, etc.) — no new color palette
- Status pills color-coded:
  - researching: gray
  - planned: indigo
  - in-progress: amber
  - active: emerald
  - completed: zinc
  - cancelled: red
- Risk pills color-coded:
  - low: emerald · medium: amber · high: orange · speculative: red
- Framer Motion for tab transitions and card mounts, matching existing motion vocabulary

## 6. Integrations

| Touchpoint | Behavior |
|---|---|
| **Finance tracker** | On status → `in-progress` or milestone with `amountNGN`, show a "Log as expense?" toast → one-click POST to `/api/finance/expenses` under an "Investments" category. Never automatic. |
| **Notification bell** | `/api/investments/reminders/due` (called on each Overview load) writes rows into the existing `Notification` model. Clicking deep-links to the detail drawer. |
| **Calendar** | `CalendarTab` reuses existing CalendarView rendering pattern, pulls events from `/api/investments/calendar` (milestones + reminders + expected exit dates). |
| **Command palette** | Add to existing `CommandPalette`: "New Investment", "Go to Investment Planning", per-investment "Open: [title]". |

## 7. Automations (V1)

All cheap, server-side, no LLMs:

1. **Stalled research nudge** — `status === 'researching'` and `updatedAt` older than 30 days → surface in Overview "Stalled" widget. Computed inside `stats/route.ts`.
2. **Goal health calc** — computed lazily on `GET /api/investments/goals` and on every write to a linked investment. Compares `(currentAmountNGN / targetAmountNGN)` vs `(elapsedDays / totalDays)` → sets `status` to `on-track | at-risk`. No cron required.
3. **Reminder recurrence** — when a recurring reminder is dismissed (`POST /api/investments/reminders/[id]/dismiss`), the same handler creates the next occurrence.
4. **Allocation drift alert** — if any category > 50% of total planned budget, soft warning surfaced in `stats/route.ts` payload, rendered in Overview.
5. **Milestone-driven progress** — `Investment.progress` auto-recomputes from `completedMilestones / totalMilestones` on every milestone toggle/edit, unless `progressManuallySet === true`. Setting `progress` directly via PUT flips `progressManuallySet` to true; clearing it via UI resets to false and triggers recompute.

## 8. Currency Handling

- `InvestmentSettings.usdToNgnRate` is the single source of truth; user-editable on a small Settings card in Overview.
- Cached client-side via React Query (1h staleTime).
- `CurrencyAmount` does math at render time; no DB double-writes.
- `displayCurrency` toggle flips which side is primary vs subtext.

## 9. Testing

Stack: existing Vitest + RTL + jsdom + 90% coverage threshold.

- **Model tests** — validators, enums, defaults for each new schema
- **Route tests** — handlers using mocked `@/lib/db` (existing pattern)
- **Component tests** — `SummaryCards`, `AllocationDonut`, `InvestmentFormModal`, `MilestonesPanel`, `CurrencyAmount`
- **Integration test** — reminder-due → Notification row roundtrip
- **Accessibility check** — keyboard navigation through tabs, form modal, drawer

## 10. Build Sequence

Five phases, each ends with green tests and a commit:

| Phase | Scope | Outcome |
|---|---|---|
| **1. Foundation** | Models, base API routes, `InvestmentSettings`, `CurrencyAmount`, sidebar entry, empty view shell | Plumbing complete |
| **2. CRUD core** | `InvestmentFormModal`, `InvestmentsTab` list view, `StatusPill`, `RiskPill`, basic filters | First usable slice |
| **3. Overview dashboard** | `SummaryCards`, `AllocationDonut`, `PortfolioProgressBar`, `RecentActivityFeed`, `stats` aggregation | Premium feel lands |
| **4. Goals + Reminders + Calendar** | `GoalsTab`, `RemindersPanel`, `CalendarTab`, Notification integration | Planning depth |
| **5. Polish & integrations** | `InvestmentDetailDrawer`, command palette entries, Finance "log as expense" link, mobile pass, board view toggle | Experience tied together |

Phase 1 + 2 alone deliver a working planning tool. Everything after compounds value.

## 11. Out of Scope (V1)

Explicitly excluded — easy adds later, but not now:

- Live market data / broker integrations
- Multi-currency per investment (only NGN base + USD display)
- File uploads (URLs only)
- Email/push reminders (in-app only)
- Multi-user / sharing
- AI-generated investment summaries or analysis
- Tax reporting / capital gains
- Historical FX rate snapshots (single live rate only)

## 12. Future Expansion Hooks

Designed so these slot in without schema migrations beyond additions:

- Live prices → add `currentValueNGN` field, write a syncing background job
- Transactions ledger → add `InvestmentTransaction` model linked to `Investment`
- AI thesis review → add a `/api/investments/[id]/review` route calling an LLM with thesis + notes
- Sharing → add `ownerId` and `sharedWith[]` to Investment; gate routes
- Push notifications → reuse existing PWA service worker, swap reminder delivery channel
