# Frontend Bug Fixes & Animation Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix critical bugs (XSS, duplicate API calls, type safety) and improve animations/flowstate across the Owen Zen frontend platform.

**Architecture:** Single comprehensive plan covering security fixes, type safety improvements, and unified animation system. Changes organized by priority: critical bugs first, then type safety, then animations.

**Tech Stack:** React, TypeScript, Framer Motion, Tailwind CSS, @dnd-kit

---

## File Structure

### Files to Modify

| File | Purpose |
|------|---------|
| `src/components/finance/ExpenseTable.tsx` | Fix XSS vulnerability |
| `src/app/page.tsx` | Remove duplicate API call, fix type safety |
| `src/components/FocusOverlay.tsx` | Fix timer bugs |
| `src/components/CommandPalette.tsx` | Add animations |
| `src/app/globals.css` | Add missing animation definitions |
| `src/lib/animations.ts` | NEW - Centralized animation constants |

---

## Task 1: Fix XSS Vulnerability in ExpenseTable

**Files:**
- Modify: `src/components/finance/ExpenseTable.tsx:107-118`

- [ ] **Step 1: Add HTML escape utility function**

Add this helper function before `renderHighlightedNote`:

```typescript
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
```

- [ ] **Step 2: Apply escaping to highlighted content**

Replace line 112:
```typescript
// Before (INSECURE):
dangerouslySetInnerHTML={{ __html: highlighted }}

// After (SECURE):
dangerouslySetInnerHTML={{ __html: escapeHtml(highlighted) }}
```

- [ ] **Step 3: Verify the fix compiles**

Run: `npm run build` or `npx tsc --noEmit`
Expected: No errors related to ExpenseTable

- [ ] **Step 4: Commit**

```bash
git add src/components/finance/ExpenseTable.tsx
git commit -m "fix: sanitize HTML in ExpenseTable to prevent XSS"
```

---

## Task 2: Remove Duplicate API Calls

**Files:**
- Modify: `src/app/page.tsx:165-170` and `src/app/page.tsx:861-866`

- [ ] **Step 1: Identify the duplicate fetch locations**

Lines 165-170 are in Sidebar component (good).
Lines 861-866 are in main page (remove this).

- [ ] **Step 2: Remove duplicate quick-links fetch in main page**

Delete lines 861-866 (the second `fetch('/api/quick-links')` block in main page).

The Sidebar component already fetches and manages quick-links, so the duplicate is unnecessary.

- [ ] **Step 3: Verify the change compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "fix: remove duplicate quick-links API call"
```

---

## Task 3: Fix FocusOverlay Timer Bugs

**Files:**
- Modify: `src/components/FocusOverlay.tsx:58-73`

**NOTE:** The dependency array `[task.activeTimer]` already exists in the original code. The fix is to add proper null checks for `startedAt` and fix the non-null assertion.

- [ ] **Step 1: Fix null safety in timer logic**

Replace the useEffect at lines 58-73:

```typescript
useEffect(() => {
  // Check both isActive AND startedAt for proper null safety
  if (!task.activeTimer?.isActive || !task.activeTimer?.startedAt) {
    setElapsedTime(0);
    return;
  }

  const calculateTime = () => {
    // Safe access - we've already checked startedAt exists above
    const start = new Date(task.activeTimer!.startedAt!).getTime();
    const now = Date.now();
    setElapsedTime(Math.floor((now - start) / 1000));
  };

  calculateTime();
  const interval = setInterval(calculateTime, 1000);
  return () => clearInterval(interval);
}, [task.activeTimer]);
```

- [ ] **Step 2: Verify compilation**

Run: `npx tsc --noEmit`
Expected: No errors in FocusOverlay.tsx

- [ ] **Step 4: Commit**

```bash
git add src/components/FocusOverlay.tsx
git commit -m "fix: add null checks and dependency array to FocusOverlay timer"
```

---

## Task 4: Create Centralized Animation Constants

**Files:**
- Create: `src/lib/animations.ts`

- [ ] **Step 1: Create animations.ts with reusable constants**

```typescript
import { Variants } from "framer-motion";

export const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const smoothTransition = {
  duration: 0.2,
  ease: "easeInOut",
};

// Fade animations
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// Scale + fade for modals
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// Slide for sidebar
export const slideInLeft: Variants = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
};

// Layout animation for list reordering
export const layoutAnimation: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/animations.ts
git commit -m "feat: add centralized animation constants"
```

---

## Task 5: Improve FocusOverlay Progress Ring Animation

**Files:**
- Modify: `src/components/FocusOverlay.tsx:137-165`

**NOTE:** The hardcoded `283` value assumes a 45% radius. Use a calculated constant for maintainability.

- [ ] **Step 1: Add animated strokeDashoffset**

Replace the progress ring section (lines 137-165). First, add a constant at the top of the component:

```typescript
// At the top of FocusOverlay component:
const PROGRESS_RING_RADIUS = 45; // matches r="45%" in SVG
const PROGRESS_RING_CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RING_RADIUS;
```

Then replace the progress ring section:

```typescript
{/* Progress Ring */}
<motion.svg
  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ delay: 0.3 }}
>
  <circle
    cx="50%"
    cy="50%"
    r="45%"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="text-white/5"
  />
  <motion.circle
    cx="50%"
    cy="50%"
    r="45%"
    fill="none"
    stroke="currentColor"
    strokeWidth="4"
    strokeLinecap="round"
    strokeDasharray={PROGRESS_RING_CIRCUMFERENCE}
    initial={{ strokeDashoffset: PROGRESS_RING_CIRCUMFERENCE }}
    animate={{ strokeDashoffset: PROGRESS_RING_CIRCUMFERENCE - (progress / 100) * PROGRESS_RING_CIRCUMFERENCE }}
    transition={{ duration: 0.7, ease: "easeOut" }}
    className={cn(
      task.activeTimer?.isActive ? "text-primary drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]" : "text-white/20"
    )}
  />
</motion.svg>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FocusOverlay.tsx
git commit -m "feat: smooth SVG progress ring animation in FocusOverlay"
```

---

## Task 6: Add Sidebar Collapse Animation

**Files:**
- Modify: `src/app/page.tsx` (Sidebar component around lines 147-500)

- [ ] **Step 1: Import animation constants**

Add to imports in page.tsx:
```typescript
import { slideInLeft, smoothTransition } from "@/lib/animations";
```

- [ ] **Step 2: Add AnimatePresence to Sidebar wrapper**

Find the Sidebar component return and wrap with AnimatePresence:

```typescript
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={slideInLeft}
      transition={smoothTransition}
      className="..."
    >
      {/* Sidebar content */}
    </motion.div>
  )}
</AnimatePresence>
```

Note: This requires significant refactoring of the Sidebar component structure. If too complex, skip to next task.

- [ ] **Step 3: Commit (if implemented)**

```bash
git add src/app/page.tsx
git commit -m "feat: add sidebar slide animation"
```

---

## Task 7: Add Modal Scale Animation

**Files:**
- Modify: `src/components/AddTaskModal.tsx`, `src/components/EditTaskModal.tsx`

- [ ] **Step 1: Import animation constants**

```typescript
import { scaleIn, springTransition } from "@/lib/animations";
```

- [ ] **Step 2: Update AddTaskModal motion.div**

Find the opening `<motion.div` in AddTaskModal (line ~75) and update:

```typescript
<motion.div
  initial="initial"
  animate="animate"
  exit="exit"
  variants={scaleIn}
  transition={springTransition}
  // ... rest of props
>
```

- [ ] **Step 3: Update EditTaskModal similarly**

- [ ] **Step 4: Commit**

```bash
git add src/components/AddTaskModal.tsx src/components/EditTaskModal.tsx
git commit -m "feat: add scale animation to task modals"
```

---

## Task 8: Add Layout Animation to Task Cards

**Files:**
- Modify: `src/components/TaskColumn.tsx`, `src/components/TaskBoard.tsx`

- [ ] **Step 1: Import layout animation**

```typescript
import { layoutAnimation } from "@/lib/animations";
```

- [ ] **Step 2: Add layout prop to TaskCard motion.div**

In TaskColumn, find the TaskCard wrapper and add:
```typescript
<motion.div
  layout
  variants={layoutAnimation}
  // ... other props
>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/TaskColumn.tsx src/components/TaskBoard.tsx
git commit -m "feat: add layout animation to task cards"
```

---

## Task 9: Add Pomodoro Pulse Animation

**Files:**
- Modify: `src/components/PomodoroWidget.tsx`

- [ ] **Step 1: Add conditional pulse during active session**

Find the timer display section and add conditional styling:

```typescript
<div className={cn(
  "text-4xl font-bold tabular-nums",
  isActive && "animate-pulse text-primary drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]"
)}>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PomodoroWidget.tsx
git commit -m "feat: add pulse effect to active Pomodoro timer"
```

---

## Summary

| Task | Description | Priority |
|------|-------------|----------|
| 1 | Fix XSS in ExpenseTable | Critical |
| 2 | Remove duplicate API calls | High |
| 3 | Fix FocusOverlay timer bugs | High |
| 4 | Create animation constants | Medium |
| 5 | Improve FocusOverlay progress ring | Medium |
| 6 | Add sidebar animation | Medium |
| 7 | Add modal scale animation | Medium |
| 8 | Add layout animation to tasks | Medium |
| 9 | Add Pomodoro pulse | Low |

---

## Dependencies

- Task 4 must complete before Tasks 5, 6, 7, 8
- Task 3 is independent
- Task 1 is independent

---

## Execution Notes

- Run `npm run build` or `npx tsc --noEmit` after each task to verify no breaking changes
- Test FocusOverlay timer manually by starting a focus session
- Verify no duplicate network requests in Network tab
