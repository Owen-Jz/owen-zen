# Command Center Redesign Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Life Command Center with richer, more visually impressive bento grid cards that show more data context from each section.

**Architecture:** Each card component is redesigned to show more detail — mini charts, breakdown lists, trend indicators — while maintaining the 12-column bento grid structure. Cards remain self-contained components in `src/components/command-center/`. The `CommandCenter.tsx` passes more refined data to each card.

**Tech Stack:** React, Tailwind CSS v4 (CSS-based), Framer Motion, Lucide icons. Theme variables (`--cc-*`) for all colors.

---

## Current Layout (12-col grid, 3 rows)

Row 1: Today(2) | Habits(3) | Tasks(4) | Finance(3)
Row 2: Gym(4) | Nutrition(4) | Growth(4) | — (4)
Row 3: Content(6) | Leads(3) | Life(3)

## Redesigned Layout (12-col grid, 4 rows)

Row 1: Today(3) | Habits(5) | Tasks(4)
Row 2: Finance(4) | Gym(4) | Nutrition(4)
Row 3: Growth(6) | Content(6)
Row 4: Leads(4) | Life(8)

---

### Task 1: Redesign TodayCard

**Files:**
- Modify: `src/components/command-center/TodayCard.tsx`

**Spec:**
- Large circular day-of-year progress ring (e.g., "Day 126 / 365")
- Current date displayed prominently (e.g., "Wednesday, May 6")
- Streak counter with flame icon
- Time-based greeting that changes by hour (Morning/Afternoon/Evening)
- Mini moon phase icon
- Background: `bg-[var(--cc-card)]`, border: `border-[var(--cc-border)]`
- Text: `style={{ color: "var(--cc-text)" }}` for primary, `style={{ color: "var(--cc-text-secondary)" }}` for secondary

**Steps:**

- [ ] **Step 1: Read the current TodayCard.tsx to understand the existing structure**

Run: Read `src/components/command-center/TodayCard.tsx`

- [ ] **Step 2: Replace with redesigned TodayCard with day ring, moon phase, richer styling**

Write the new component with SVG ring showing day of year, formatted date, streak with flame, time-based greeting, moon phase.

- [ ] **Step 3: Verify it renders correctly**

Run: Start dev server on port 3002, navigate to `/command-center`, confirm Today card shows day ring and all elements.

- [ ] **Step 4: Commit**

```bash
git add src/components/command-center/TodayCard.tsx
git commit -m "feat(command-center): redesign TodayCard with day-of-year ring and moon phase"
```

---

### Task 2: Redesign HabitCard

**Files:**
- Modify: `src/components/command-center/HabitCard.tsx`

**Spec:**
- Show the top 4 habits with individual mini progress bars (not just aggregate %)
- Each habit row: habit name + streak count + inline progress bar
- 7-day trend sparkline at bottom (existing SVG line, keep it but make it more prominent)
- Overall completion % in a large ring in the corner
- Background: `bg-[var(--cc-card)]`, border: `border-[var(--cc-border)]`
- Use `var(--cc-accent)` for progress bar fills, `var(--cc-border)` for track

**Steps:**

- [ ] **Step 1: Read current HabitCard.tsx**

- [ ] **Step 2: Redesign with individual habit rows + mini progress bars**

- [ ] **Step 3: Verify and commit**

---

### Task 3: Redesign TaskCard

**Files:**
- Modify: `src/components/command-center/TaskCard.tsx`

**Spec:**
- MIT count (highlighted in `var(--cc-accent)`)
- Overdue count (highlighted in `var(--cc-warning)`)
- Total task count
- NEW: Priority breakdown — show small colored dots for high/medium/low priority tasks in the list
- NEW: A mini list showing the top 3 MIT task titles (truncated to 30 chars)
- Show tasks due "Today" vs "This Week" vs "Later" counts
- Background: `bg-[var(--cc-card)]`, border: `border-[var(--cc-border)]`

**Steps:**

- [ ] **Step 1: Read current TaskCard.tsx**

- [ ] **Step 2: Add priority breakdown and top MIT list**

- [ ] **Step 3: Verify and commit**

---

### Task 4: Redesign FinanceCard

**Files:**
- Modify: `src/components/command-center/FinanceCard.tsx`

**Spec:**
- Balance displayed prominently
- Budget usage bar (color changes: green <80%, yellow 80-100%, red >100%)
- NEW: Last 3 transactions shown as mini list (description + amount + date)
- NEW: Top spending category with icon and amount
- Use the Finance stats API response shape (it has `summary` and `categoryBreakdown`)
- Background: `bg-[var(--cc-card)]`, border: `border-[var(--cc-border)]`

**Steps:**

- [ ] **Step 1: Read current FinanceCard.tsx**

- [ ] **Step 2: Check the finance stats API to understand the response shape**

Run: `curl -s http://localhost:3002/api/finance/stats`

- [ ] **Step 3: Add transaction list and top category**

- [ ] **Step 4: Verify and commit**

---

### Task 5: Redesign GymCard

**Files:**
- Modify: `src/components/command-center/GymCard.tsx`

**Spec:**
- Sessions this week: X/4 with progress bar
- Gym streak with flame
- NEW: Next scheduled workout displayed as text (from `nextWorkout` prop)
- NEW: Last 3 gym sessions shown as mini list with date and type/sets/reps
- Muscle group icons or colored dots for workout type
- Background: `bg-[var(--cc-card)]`, border: `border-[var(--cc-border)]`

**Steps:**

- [ ] **Step 1: Read current GymCard.tsx**

- [ ] **Step 2: Redesign with recent sessions list and next workout text**

- [ ] **Step 3: Verify and commit**

---

### Task 6: Redesign NutritionCard

**Files:**
- Modify: `src/components/command-center/NutritionCard.tsx`

**Spec:**
- Meals logged: X/3 with mini progress bar
- Macro ring chart: protein (accent color), carbs (success color), fat (warning color)
- NEW: Last 3 logged meals shown as list with name and time
- Protein/carbs/fat displayed in grams
- Daily calorie estimate (P*4 + C*4 + F*9)
- Background: `bg-[var(--cc-card)]`, border: `border-[var(--cc-border)]`

**Steps:**

- [ ] **Step 1: Read current NutritionCard.tsx**

- [ ] **Step 2: Redesign with meal log list and calorie estimate**

- [ ] **Step 3: Verify and commit**

---

### Task 7: Redesign GrowthCard

**Files:**
- Modify: `src/components/command-center/GrowthCard.tsx`

**Spec:**
- Top 3 courses with individual progress bars (show % and current level)
- NEW: If no courses, show "No active courses" with a plus icon
- Total XP / Level display
- Next achievement to unlock (title + XP needed)
- Background: `bg-[var(--cc-card)]`, border: `border-[var(--cc-border)]`
- Progress bars: `style={{ backgroundColor: "var(--cc-accent)" }}`

**Steps:**

- [ ] **Step 1: Read current GrowthCard.tsx**

- [ ] **Step 2: Redesign with course list, XP display, next achievement**

- [ ] **Step 3: Verify and commit**

---

### Task 8: Redesign ContentCard

**Files:**
- Modify: `src/components/command-center/ContentCard.tsx`

**Spec:**
- Posts this week count
- 7-day calendar row (S M T W T F S with dots for scheduled days)
- NEW: Next 2 scheduled posts shown as mini list (title + date)
- If no posts scheduled, show "No posts scheduled" placeholder
- Background: `bg-[var(--cc-card)]`, border: `border-[var(--cc-border)]`

**Steps:**

- [ ] **Step 1: Read current ContentCard.tsx**

- [ ] **Step 2: Add next scheduled posts list**

- [ ] **Step 3: Verify and commit**

---

### Task 9: Redesign LeadsCard

**Files:**
- Modify: `src/components/command-center/LeadsCard.tsx`

**Spec:**
- Open/Qualified/Closed counts in colored boxes
- Total leads count
- NEW: Funnel visualization — a simple horizontal bar showing open→qualified→closed proportions
- NEW: Most recent lead name with timestamp
- Background: `bg-[var(--cc-card)]`, border: `border-[var(--cc-border)]`

**Steps:**

- [ ] **Step 1: Read current LeadsCard.tsx**

- [ ] **Step 2: Add funnel bar and recent lead**

- [ ] **Step 3: Verify and commit**

---

### Task 10: Redesign LifeCard

**Files:**
- Modify: `src/components/command-center/LifeCard.tsx`

**Spec:**
- Inbox count
- Bucket list top 2 items with checkmarks
- Journal streak with flame
- Next bucket list item goal ("Next: [item title]")
- NEW: A motivational or contextual one-liner at bottom (e.g., "Keep the momentum going" or similar)
- Background: `bg-[var(--cc-card)]`, border: `border-[var(--cc-border)]`

**Steps:**

- [ ] **Step 1: Read current LifeCard.tsx**

- [ ] **Step 2: Redesign with goal text and motivational line**

- [ ] **Step 3: Verify and commit**

---

### Task 11: Update CommandCenter with new card props

**Files:**
- Modify: `src/components/command-center/CommandCenter.tsx`

**Spec:**
After all cards are redesigned, update `CommandCenter.tsx` to pass any new data needed:
- `FinanceCard`: pass `transactions` array if available from API
- `GymCard`: pass `recentSessions` array
- `NutritionCard`: pass `recentMeals` array
- `GrowthCard`: pass `nextAchievement` string and `totalXP`
- `ContentCard`: pass `scheduledPosts` array
- `LeadsCard`: pass `recentLead` object
- `LifeCard`: pass `nextBucketItem` string

Also update the BentoGrid column span layout to match the new 4-row layout:
Row 1: Today(3) | Habits(5) | Tasks(4)
Row 2: Finance(4) | Gym(4) | Nutrition(4)
Row 3: Growth(6) | Content(6)
Row 4: Leads(4) | Life(8)

**Steps:**

- [ ] **Step 1: Update BentoGrid column spans in CommandCenter.tsx**

- [ ] **Step 2: Update data fetching to extract new fields**

- [ ] **Step 3: Verify all cards render correctly with new data**

- [ ] **Step 4: Verify and commit**

```bash
git add src/components/command-center/CommandCenter.tsx
git commit -m "feat(command-center): update card props and bento grid layout for redesign"
```

---

### Task 12: Final verification

**Files:**
- Verify: `src/components/command-center/*.tsx`

**Steps:**

- [ ] **Step 1: Take a full-page screenshot of the command center at 1920x1080**

Run Playwright to capture and save screenshot.

- [ ] **Step 2: Navigate through all cards, verify no overflow or layout break**

- [ ] **Step 3: Verify theme variables work by switching themes**

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(command-center): complete redesign with richer card content

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```