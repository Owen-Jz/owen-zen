# Zen Dark Charcoal & Crimson Theme Fix

## Bug
In `globals.css` line 85: `--background: oklch(1 0 0)` is **white** (100% lightness). The Zen dark theme has no `[data-theme]` attribute set by default, so it falls back to `:root` values — showing white instead of dark charcoal. The `.dark` class (line 718) uses oklch values but is not applied by default.

## Root Cause
The Zen theme (default) should render dark but uses `:root` CSS variables where `--background` is white. The `data-theme` attribute is only set when user selects a theme, otherwise no theme is active.

## Fix

### 1. Update `:root` CSS Variables (lines 35-115)
Change the default `:root` block to use Zen dark theme values:

```css
:root {
  /* Zen Dark - Deep Charcoal & Crimson */
  --background: #0a0a0a;
  --foreground: #f5f5f5;
  --primary: #dc2626;
  --primary-rgb: 220, 38, 38;
  --primary-light: #ef4444;
  --surface: #141414;
  --surface-hover: #1a1a1a;
  --border: #262626;

  --white: #ffffff;
  --black: #000000;

  --gray-50: #fafafa;
  --gray-100: #f5f5f5;
  --gray-200: #e5e5e5;
  --gray-300: #d4d4d4;
  --gray-400: #a3a3a3;
  --gray-500: #737373;
  --gray-600: #525252;
  --gray-700: #404040;
  --gray-800: #262626;
  --gray-900: #141414;

  --color-success: #22c55e;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  --color-info: #3b82f6;

  --status-income: #22c55e;
  --status-expense: #ef4444;
  --status-positive: #22c55e;
  --status-negative: #ef4444;
  --status-warning: #f59e0b;

  --priority-high: #ef4444;
  --priority-medium: #f59e0b;
  --priority-low: #3b82f6;

  --confetti-red: #ef4444;
  --confetti-orange: #f97316;
  --confetti-yellow: #eab308;
  --confetti-green: #22c55e;
  --confetti-blue: #3b82f6;
  --confetti-purple: #8b5cf6;
  --confetti-pink: #ec4899;

  --card: #141414;
  --card-foreground: #f5f5f5;
  --popover: #141414;
  --popover-foreground: #f5f5f5;
  --primary-foreground: #ffffff;
  --secondary: #262626;
  --secondary-foreground: #f5f5f5;
  --muted: #262626;
  --muted-foreground: #a3a3a3;
  --accent: #dc2626;
  --accent-foreground: #ffffff;
  --destructive: #ef4444;
  --input: #262626;
  --ring: #dc2626;
  --chart-1: #dc2626;
  --chart-2: #f59e0b;
  --chart-3: #22c55e;
  --chart-4: #3b82f6;
  --chart-5: #8b5cf6;
  --radius: 0.625rem;
  --sidebar: #0a0a0a;
  --sidebar-foreground: #f5f5f5;
  --sidebar-primary: #dc2626;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #262626;
  --sidebar-accent-foreground: #f5f5f5;
  --sidebar-border: #262626;
  --sidebar-ring: #dc2626;
}
```

### 2. Remove `.dark` Class Conflicts (line 718)
Remove or update the `.dark` class since Zen default should now be dark. The `.dark` class was adding dark mode on top of an already-white base — causing confusion.

### 3. Set Default Theme in layout.tsx
Add `data-theme="zen"` to the `<html>` element as the default, so dark theme applies even before JS loads.

## Aesthetic
- **Background**: `#0a0a0a` — deep charcoal, not pure black (warmth)
- **Surface layers**: `#141414`, `#1a1a1a` — subtle elevation hierarchy
- **Primary**: `#dc2626` crimson red — bold accent
- **Borders**: `#262626` — subtle separation

## Files to Modify
1. `src/app/globals.css` — fix `:root` values, remove/update `.dark` class
2. `src/app/layout.tsx` — add default `data-theme="zen"` to `<html>`