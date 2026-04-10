# Design Quality Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 84 design quality issues identified in the audit across 8 areas: Logo/Brand, Color/Typography, UI Components, States/Animations, Design Tokens, Imagery/Iconography, Email/Print/Cross-Platform, and Mobile/Spacing/Responsive.

**Architecture:** This is a comprehensive audit fix spanning multiple subsystems. The approach is to tackle high-impact foundational fixes first (CSS utilities, design tokens, accessibility), then systematically work through component-level issues. Independent tasks will be parallelized where possible.

**Tech Stack:** CSS (Tailwind v4), React, Framer Motion, Lucide React, Next.js

---

## File Structure Overview

### New Files to Create
- `src/lib/hapticService.ts` - Haptic feedback patterns and service
- `src/components/ui/Toast.tsx` - Toast notification component
- `src/components/ui/EmptyState.tsx` - Shared empty state component
- `src/components/ui/ErrorState.tsx` - Error state with retry component
- `src/hooks/useReducedMotion.ts` - Reduced motion preference hook
- `src/hooks/useHaptics.ts` - Haptic feedback hook
- `src/utils/toast.ts` - Toast utility functions
- `docs/design-tokens.md` - Token documentation

### Files to Modify
- `src/app/globals.css` - Add scrollbar-hide, print styles, fix z-index tokens, add touch target utilities
- `src/app/page.tsx` - Replace hardcoded Matrix theme colors with CSS tokens
- `src/components/DatePicker.tsx` - Increase touch target sizes
- `src/components/TaskColumn.tsx` - Fix subtask checkbox touch targets, icon button sizes
- `src/components/Loading.tsx` - Use CSS variables for text colors
- `src/components/NotificationBell.tsx` - Add aria-live for accessibility
- `src/app/landing/landing.css` - Unify tokens with globals.css
- `src/components/ZCanvas.tsx` - Fix hardcoded canvas node colors
- `src/components/canvas/CanvasNode.tsx` - Fix hardcoded colors
- `src/lib/chartConfigs.tsx` - Make colors theme-aware
- `src/components/VisionBoardView.tsx` - Add descriptive alt text
- `src/components/FinanceView.tsx` - Fix hardcoded status colors
- `src/components/TaskBoard.tsx` - Fix priority filter chip colors
- `src/components/GymView.tsx` - Fix hardcoded category colors
- `src/components/Confetti.tsx` - Use theme colors
- `src/components/InboxView.tsx` - Add loading="lazy" to images
- `src/components/SocialHubView.tsx` - Fix alt text and LinkedIn colors
- `src/components/DisciplineChallenge.tsx` - Fix hardcoded colors
- `src/components/JournalView.tsx` - Document mood colors
- `public/icon.svg` - Update to match logo red #dc2626
- `public/logo.svg` - Consistency check
- `mobile-login.html` - Fix brand colors

---

## Task Breakdown

### Task 1: Add scrollbar-hide and z-index CSS utilities to globals.css

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add scrollbar-hide utility**

Add after line 447 (after webkit-scrollbar-thumb:hover):
```css
/* Scrollbar hide utility */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

- [ ] **Step 2: Add z-index token scale**

Add before line 495 (before Animation timing tokens):
```css
/* Z-index token scale */
:root {
  --z-base: 0;
  --z-dropdown: 50;
  --z-sticky: 100;
  --z-modal: 200;
  --z-overlay: 300;
  --z-toast: 400;
  --z-modal: 500;
}
```

- [ ] **Step 3: Add print styles**

Add at end of globals.css (before closing style tag if any):
```css
/* Print styles */
@media print {
  body {
    background: white !important;
    color: black !important;
  }
  .no-print,
  nav,
  .sidebar,
  header {
    display: none !important;
  }
  a[href]::after {
    content: " (" attr(href) ")";
  }
  @page {
    margin: 1cm;
  }
}
```

- [ ] **Step 4: Add safe-area-inset for iOS**

Add to body selector (line 374):
```css
body {
  /* ... existing styles ... */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}
```

- [ ] **Step 5: Add touch target utility classes**

Add before line 481 (before Radius Token System comment):
```css
/* Touch target utilities - ensures 44x44px minimum */
@utility touch-target {
  min-width: 44px;
  min-height: 44px;
}
```

- [ ] **Step 6: Verify changes**

Run: Check that globals.css has no syntax errors by building the project
Expected: Build succeeds

---

### Task 2: Create haptic feedback service

**Files:**
- Create: `src/lib/hapticService.ts`
- Create: `src/hooks/useHaptics.ts`

- [ ] **Step 1: Create hapticService.ts**

```typescript
// Haptic feedback patterns and service
type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const HAPTIC_PATTERNS: Record<HapticPattern, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 10],
  warning: [20, 30, 20],
  error: [30, 30, 30],
  selection: [5],
};

const isReducedMotion = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false;

export const hapticService = {
  trigger(pattern: HapticPattern): void {
    if (isReducedMotion) return;
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;

    const patternValues = HAPTIC_PATTERNS[pattern];
    if (patternValues) {
      navigator.vibrate(patternValues);
    }
  },

  // Convenience methods
  impactLight: () => hapticService.trigger('light'),
  impactMedium: () => hapticService.trigger('medium'),
  impactHeavy: () => hapticService.trigger('heavy'),
  success: () => hapticService.trigger('success'),
  warning: () => hapticService.trigger('warning'),
  error: () => hapticService.trigger('error'),
  selection: () => hapticService.trigger('selection'),
};
```

- [ ] **Step 2: Create useHaptics.ts hook**

```typescript
import { useCallback } from 'react';
import { hapticService } from '@/lib/hapticService';

export const useHaptics = () => {
  const impactLight = useCallback(() => hapticService.impactLight(), []);
  const impactMedium = useCallback(() => hapticService.impactMedium(), []);
  const impactHeavy = useCallback(() => hapticService.impactHeavy(), []);
  const success = useCallback(() => hapticService.success(), []);
  const warning = useCallback(() => hapticService.warning(), []);
  const error = useCallback(() => hapticService.error(), []);
  const selection = useCallback(() => hapticService.selection(), []);

  return {
    impactLight,
    impactMedium,
    impactHeavy,
    success,
    warning,
    error,
    selection,
  };
};
```

- [ ] **Step 3: Verify files compile**

Run: `npx tsc --noEmit src/lib/hapticService.ts src/hooks/useHaptics.ts`
Expected: No errors

---

### Task 3: Create Toast notification system

**Files:**
- Create: `src/components/ui/Toast.tsx`
- Create: `src/utils/toast.ts`

- [ ] **Step 1: Create toast utility with sonner**

Run: `npm install sonner`
Expected: sonner installed

- [ ] **Step 2: Create toast.ts utilities**

```typescript
'use client';
import { toast } from 'sonner';

// Toast convenience functions
export const toastSuccess = (message: string) => toast.success(message, {
  duration: 4000,
  className: 'toast-success',
});

export const toastError = (message: string) => toast.error(message, {
  duration: 5000,
  className: 'toast-error',
});

export const toastWarning = (message: string) => toast.warning(message, {
  duration: 4000,
  className: 'toast-warning',
});

export const toastInfo = (message: string) => toast.info(message, {
  duration: 3000,
  className: 'toast-info',
});

export const toastPromise = <T>(
  promise: Promise<T>,
  messages: { loading: string; success: string; error: string }
) => toast.promise(promise, {
  loading: messages.loading,
  success: messages.success,
  error: messages.error,
});
```

- [ ] **Step 3: Add Toast component to layout**

Modify: `src/app/layout.tsx` - import and add Toaster component
```tsx
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--surface)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            },
          }}
        />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds

---

### Task 4: Create shared EmptyState and ErrorState components

**Files:**
- Create: `src/components/ui/EmptyState.tsx`
- Create: `src/components/ui/ErrorState.tsx`

- [ ] **Step 1: Create EmptyState component**

```tsx
'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'filtered';
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default'
}: EmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
        <Icon size={24} className="text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-200 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-light transition-colors"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};
```

- [ ] **Step 2: Create ErrorState component**

```tsx
'use client';

import { useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  error?: Error | null;
}

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading this content.',
  onRetry,
  error
}: ErrorStateProps) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center p-8 text-center"
    >
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <AlertCircle size={24} className="text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-200 mb-2">{title}</h3>
      {message && (
        <p className="text-sm text-gray-500 max-w-sm mb-4">{message}</p>
      )}
      {error && (
        <p className="text-xs text-gray-600 font-mono mb-4 max-w-md">
          {error.message}
        </p>
      )}
      {onRetry && (
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-xl font-medium hover:bg-surface-hover transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRetrying ? 'animate-spin' : ''} />
          {isRetrying ? 'Retrying...' : 'Try Again'}
        </button>
      )}
    </motion.div>
  );
};
```

- [ ] **Step 3: Verify components compile**

Run: `npx tsc --noEmit src/components/ui/EmptyState.tsx src/components/ui/ErrorState.tsx`
Expected: No errors

---

### Task 5: Create useReducedMotion hook

**Files:**
- Create: `src/hooks/useReducedMotion.ts`

- [ ] **Step 1: Create useReducedMotion hook**

```typescript
import { useState, useEffect } from 'react';

export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};
```

- [ ] **Step 2: Verify hook compiles**

Run: `npx tsc --noEmit src/hooks/useReducedMotion.ts`
Expected: No errors

---

### Task 6: Fix DatePicker touch targets

**Files:**
- Modify: `src/components/DatePicker.tsx:135`

- [ ] **Step 1: Increase DatePicker day button touch target**

Find line 135:
```tsx
className={cn(
  "p-1.5 flex justify-center items-center rounded-xl text-xs font-medium transition-all w-8 h-8",
```

Change to:
```tsx
className={cn(
  "p-2 flex justify-center items-center rounded-xl text-sm font-medium transition-all w-11 h-11",
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

---

### Task 7: Fix TaskColumn subtask checkbox and icon button touch targets

**Files:**
- Modify: `src/components/TaskColumn.tsx:296, 177, 200`

- [ ] **Step 1: Increase subtask checkbox touch target**

Find line 296 (w-4 h-4) and wrap in larger touch target:
```tsx
{/* Before */}
<div className="w-4 h-4 mt-0.5 rounded-md border flex items-center justify-center...">

{/* After */}
<div
  className="w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center cursor-pointer"
  onClick={(e) => { e.stopPropagation(); onToggleSubtask && onToggleSubtask(task._id, i); }}
>
  {/* checkbox content */}
</div>
```

- [ ] **Step 2: Increase icon button sizes**

Find lines 177 and 200 (p-1.5) and change to p-2:
```tsx
// Line 177: p-1.5 text-gray-500 -> p-2 text-gray-500
// Line 200: p-1.5 text-gray-500 -> p-2 text-gray-500
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

---

### Task 8: Fix hardcoded Matrix theme colors in page.tsx

**Files:**
- Modify: `src/app/page.tsx:510-512, 554`

- [ ] **Step 1: Replace hardcoded Matrix theme colors**

Find lines 510-512:
```tsx
<div className="w-full h-28 bg-[#000000] rounded-lg mb-4 border border-[#003b00] relative...">
```

Replace with:
```tsx
<div className="w-full h-28 bg-black rounded-lg mb-4 border border-[#003b00] relative...">
```

Find line 512:
```tsx
<div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#008f11]...">
```

Replace with:
```tsx
<div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#008f11]...">
```

Find line 554:
```tsx
<div className="w-full h-28 bg-[#ffffff] rounded-lg mb-4 border border-[#d4d4d8]...">
```

Replace with:
```tsx
<div className="w-full h-28 bg-white rounded-lg mb-4 border border-[#d4d4d8]...">
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

---

### Task 9: Fix Loading component text colors

**Files:**
- Modify: `src/components/Loading.tsx:31-32`

- [ ] **Step 1: Replace hardcoded text colors**

Find lines 31-32:
```tsx
<span className="text-sm font-bold text-gray-300 tracking-[0.2em] uppercase">{text}</span>
<span className="text-[10px] text-gray-500">Stay Focused</span>
```

Replace with:
```tsx
<span className="text-sm font-bold text-foreground/80 tracking-[0.2em] uppercase">{text}</span>
<span className="text-[10px] text-foreground/50">Stay Focused</span>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

---

### Task 10: Add aria-live to NotificationBell

**Files:**
- Modify: `src/components/NotificationBell.tsx`

- [ ] **Step 1: Add aria-live to notification container**

Find the notification list container div and add aria-live attribute:
```tsx
<div
  className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto..."
  aria-live="polite"
>
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

---

### Task 11: Fix canvas node hardcoded colors

**Files:**
- Modify: `src/components/ZCanvas.tsx:370,439,466`, `src/components/canvas/CanvasNode.tsx:24-31`

- [ ] **Step 1: Replace hardcoded orange with primary**

Find '#f97316' in ZCanvas.tsx and replace with 'var(--primary)':
```tsx
// Use CSS variable: bg-[var(--primary)]
```

Find '#f97316' in CanvasNode.tsx:
```tsx
// Replace with: color: nodeData.color || 'var(--primary)'
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

---

### Task 12: Fix icon.svg red color to match logo.svg

**Files:**
- Modify: `public/icon.svg`

- [ ] **Step 1: Update icon.svg color**

Find line 2 in icon.svg:
```svg
<path d="..." fill="#B02222"/>
```

Replace with:
```svg
<path d="..." fill="#dc2626"/>
```

- [ ] **Step 2: Verify file is valid SVG**

Run: Check file opens correctly

---

### Task 13: Fix VisionBoardView alt text

**Files:**
- Modify: `src/components/VisionBoardView.tsx:144`

- [ ] **Step 1: Update VisionBoardView alt text**

Find line 144:
```tsx
alt="Vision"
```

Replace with descriptive alt based on the image context. If the image is part of a moodboard category, use that category name:
```tsx
alt={item.label || "Vision board image"}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

---

### Task 14: Fix FinanceView hardcoded status colors

**Files:**
- Modify: `src/components/FinanceView.tsx:226,530-545,934-937`

- [ ] **Step 1: Replace hardcoded status colors**

Find and replace:
- `#ef4444` (red) → `var(--color-error)` or `rgb(var(--color-error))`
- `#22c55e` (green) → `var(--color-success)`
- `#f59e0b` (amber) → `var(--color-warning)`

Note: These may be inline style values, convert to use CSS variables or Tailwind classes.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

---

### Task 15: Fix TaskBoard priority filter chip colors

**Files:**
- Modify: `src/components/TaskBoard.tsx:256-260`

- [ ] **Step 1: Replace hardcoded priority colors with theme-aware classes**

Find lines 256-260:
```tsx
filter === 'high' ? "bg-red-500/20 text-red-500 border-red-500/50" :
  filter === 'medium' ? "bg-amber-500/20 text-amber-500 border-amber-500/50" :
    filter === 'low' ? "bg-blue-500/20 text-blue-500 border-blue-500/50" :
```

Replace with theme-aware alternatives. Since Tailwind doesn't have theme-aware generic colors, create utility classes in globals.css first.

Add to globals.css:
```css
@utility priority-high {
  @apply bg-red-500/20 text-red-500 border-red-500/50;
}
@utility priority-medium {
  @apply bg-amber-500/20 text-amber-500 border-amber-500/50;
}
@utility priority-low {
  @apply bg-blue-500/20 text-blue-500 border-blue-500/50;
}
```

Then use those classes in TaskBoard.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

---

### Task 16: Fix Confetti component colors

**Files:**
- Modify: `src/components/Confetti.tsx:16`

- [ ] **Step 1: Make Confetti colors theme-aware**

Find the color array:
```tsx
const COLORS = ['#dc2626', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
```

Replace with theme-aware approach. Since confetti is celebratory, keep primary brand colors but document why:
```tsx
// Note: Celebratory confetti uses fixed brand colors for visual impact
const BRAND_COLORS = ['#dc2626', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
const COLORS = BRAND_COLORS;
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

---

### Task 17: Add loading="lazy" to img elements

**Files:**
- Modify: `src/components/InboxView.tsx:353`, `src/components/SocialHubView.tsx:410,573`

- [ ] **Step 1: Add loading="lazy" to img tags**

In InboxView.tsx line 353:
```tsx
<img src={ytThumb} alt="" className="w-full h-full object-cover opacity-80" />
```
Add loading="lazy":
```tsx
<img src={ytThumb} alt="" loading="lazy" className="w-full h-full object-cover opacity-80" />
```

In SocialHubView.tsx:
```tsx
<img src={post.imageUrl} alt="Post visual" loading="lazy" className="w-full h-full object-cover opacity-80 ..." />
<img src={imageUrl} alt="Preview" loading="lazy" className="w-full h-full object-contain" />
```

- [ ] **Step 2: Update SocialHubView alt text to be descriptive**

Change alt="Post visual" to alt={`Social post image ${idx + 1}` or similar descriptive text.
Change alt="Preview" to alt="Image preview for social post"

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

---

### Task 18: Update mobile-login.html brand colors

**Files:**
- Modify: `mobile-login.html`

- [ ] **Step 1: Replace purple gradient with brand red**

Find the gradient:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

Replace with brand colors:
```css
background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
```

- [ ] **Step 2: Verify file syntax**

Run: Check HTML syntax

---

### Task 19: Document all design tokens

**Files:**
- Create: `docs/design-tokens.md`

- [ ] **Step 1: Create comprehensive token documentation**

```markdown
# Design Tokens Documentation

## Color Tokens

### Primitive Tokens (Raw Values)
- --background: #030303 (default dark)
- --foreground: #f5f5f5
- --primary: #dc2626
- --primary-rgb: 220, 38, 38
- --primary-light: #ef4444
- --surface: #0a0a0a
- --surface-hover: #141414
- --border: #262626
- --white: #ffffff
- --black: #000000

### Semantic Tokens
- --color-success: #22c55e
- --color-error: #ef4444
- --color-warning: #f59e0b
- --color-info: #3b82f6

### Gray Scale
- --gray-50 through --gray-900 (inverted in light mode)

## Typography
- Font: var(--font-manrope) via next/font
- Scale: .text-h1 through .text-overline

## Animation
- --duration-fast: 150ms
- --duration-normal: 300ms
- --duration-slow: 500ms
- --ease-default: cubic-bezier(0.4, 0, 0.2, 1)

## Border Radius
- --radius-sm: 0.375rem (rounded-md)
- --radius-md: 0.5rem (rounded-lg)
- --radius-lg: 0.75rem (rounded-xl)
- --radius-xl: 1rem (rounded-2xl)
- --radius-2xl: 1.5rem (rounded-3xl)

## Z-Index Scale
- --z-base: 0
- --z-dropdown: 50
- --z-sticky: 100
- --z-modal: 200
- --z-overlay: 300
- --z-toast: 400

## Shadow Tokens
(Define in globals.css)
- shadow-glow: using var(--primary-rgb)

## Icon
- --icon-stroke: 1.5 (standard stroke weight)
```

- [ ] **Step 2: Verify file created**

Run: `ls docs/design-tokens.md`
Expected: File exists

---

### Task 20: Landing page token alignment

**Files:**
- Modify: `src/app/landing/landing.css`

- [ ] **Step 1: Replace landing.css tokens with globals.css tokens**

In landing.css, find variable definitions that should match globals.css:
- --bg-primary → --background
- --text-primary → --foreground
- --accent-primary → --primary

Replace with references to globals.css tokens where possible.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

---

### Task 21: Chart colors theme-awareness

**Files:**
- Modify: `src/lib/chartConfigs.tsx`

- [ ] **Step 1: Make chart colors theme-aware**

Replace hardcoded chart colors with CSS variable references or a theme-aware color function:
```tsx
const getChartColors = () => ({
  primary: 'var(--primary)',
  // ... other colors
});
```

Use these in chart configurations instead of hardcoded hex values.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

---

### Task 22: Verify all changes with final build

**Files:**
- All modified files

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No lint errors (or only pre-existing ones)

---

## Verification Commands

After each task:
- Run: `npm run build` to verify build succeeds
- Run: `npm run lint` to verify no new lint errors

Final verification:
- Run: `npm run dev` and visually check key components
- Test print styles by printing a page

---

## Notes

- Some tasks depend on Task 1 (globals.css additions) being complete first
- Tasks 2-5 (new components/services) can be done in parallel
- Tasks 6-18 (component fixes) have some parallelism possible
- Task 19 (token docs) can be done anytime
- Task 22 is the final verification step

---
