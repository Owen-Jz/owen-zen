# Theme Audit & Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure every theme is properly defined in CSS, the Lavender/Rose/Ocean themes use the standard variable format, all hardcoded colors in components are replaced with CSS variables, and the viewport themeColor updates per theme.

**Architecture:** All theme definitions live in `globals.css`. Components use CSS variables (`var(--surface)`, `var(--primary)`, etc.) instead of hardcoded hex values. The theme loading effect in `page.tsx` updates the viewport themeColor meta tag.

**Tech Stack:** CSS custom properties, Next.js `useEffect`, Tailwind CSS

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/app/globals.css` | All 16 theme CSS definitions + 8 missing ones |
| `src/app/page.tsx` | Theme loading effect + viewport themeColor update |
| `src/components/FinanceView.tsx` | Fix hardcoded surface/background colors |
| `src/components/finance/AnalysisComponents.tsx` | Fix hardcoded semantic colors |
| `src/components/finance/ExpenseTable.tsx` | Fix hardcoded muted color |
| `src/components/canvas/AIChatPanel.tsx` | Fix hardcoded success/error colors |
| `src/components/canvas/CanvasNode.tsx` | Fix hardcoded primary/error colors |
| `src/components/canvas/NodeModal.tsx` | Fix hardcoded success/error colors |
| `src/components/ZCanvas.tsx` | Fix hardcoded primary button in help modal |
| `src/components/InboxView.tsx` | Fix hardcoded surface backgrounds |
| `src/components/NotesView.tsx` | Fix hardcoded surface backgrounds |
| `src/components/ShoppingListModal.tsx` | Fix hardcoded surface backgrounds |

---

## Task 1: Add 8 Missing Theme CSS Definitions

**Files:** `src/app/globals.css`

### Step 1: Read the current theme section

Read `src/app/globals.css` and find where the last theme block (Neon, around line 672) ends and where the `[data-theme="light"]` block starts. You'll add the 8 new themes right before `[data-theme="light"]`.

### Step 2: Add Midnight theme CSS

Insert before `[data-theme="light"]` (around line 128):

```css
[data-theme="midnight"] {
  /* Midnight - Deep Indigo */
  --background: #0a0a1a;
  --foreground: #e0e7ff;
  --primary: #6366f1;
  /* Indigo-500 */
  --primary-light: #818cf8;
  /* Indigo-400 */
  --surface: #0f0f2a;
  --surface-hover: #1a1a3d;
  --border: #2d2d5a;
}
```

### Step 3: Add Cherry theme CSS

```css
[data-theme="cherry"] {
  /* Cherry - Soft Red-Pink */
  --background: #1a0a14;
  --foreground: #fce7f3;
  --primary: #ec4899;
  /* Pink-500 */
  --primary-light: #f472b6;
  /* Pink-400 */
  --surface: #2d1020;
  --surface-hover: #3d1530;
  --border: #4a2040;
}
```

### Step 4: Add Forest theme CSS

```css
[data-theme="forest"] {
  /* Forest - Deep Green */
  --background: #051a0d;
  --foreground: #dcfce7;
  --primary: #22c55e;
  /* Green-500 */
  --primary-light: #4ade80;
  /* Green-400 */
  --surface: #0a2d18;
  --surface-hover: #123d22;
  --border: #145230;
}
```

### Step 5: Add Nord theme CSS

```css
[data-theme="nord"] {
  /* Nord - Arctic Cool */
  --background: #2e3440;
  /* Polar Night 0 */
  --foreground: #e5e9f0;
  /* Snow Storm 0 */
  --primary: #88c0d0;
  /* Frost 0 */
  --primary-light: #81a1c1;
  /* Aurora 1 */
  --surface: #3b4252;
  /* Polar Night 1 */
  --surface-hover: #434c5e;
  /* Polar Night 2 */
  --border: #4c566a;
  /* Polar Night 3 */
}
```

### Step 6: Add Dracula theme CSS

```css
[data-theme="dracula"] {
  /* Dracula - Purple Night */
  --background: #282a36;
  --foreground: #f8f8f2;
  --primary: #bd93f9;
  /* Purple */
  --primary-light: #d6acff;
  /* Light Purple */
  --surface: #1e1f29;
  --surface-hover: #242442;
  --border: #44475a;
  /* Selection */
}
```

### Step 7: Add Chocolate theme CSS

```css
[data-theme="chocolate"] {
  /* Chocolate - Coffee Brown */
  --background: #1e1b18;
  --foreground: #f5f0e8;
  --primary: #cd853f;
  /* Peru / terracotta */
  --primary-light: #daa520;
  /* Goldenrod */
  --surface: #2a2622;
  --surface-hover: #3a2e24;
  --border: #4a4038;
}
```

### Step 8: Add Arctic theme CSS (light theme)

```css
[data-theme="arctic"] {
  /* Arctic - Icy White (light theme) */
  --background: #f6f8fa;
  --foreground: #24292f;
  --primary: #0969da;
  /* GitHub blue */
  --primary-light: #58a6ff;
  --surface: #ffffff;
  --surface-hover: #f0f0f0;
  --border: #d0d7de;

  /* Invert white/black for light mode */
  --white: #18181b;
  --black: #ffffff;

  /* Invert grays for light mode */
  --gray-50: #18181b;
  --gray-100: #27272a;
  --gray-200: #3f3f46;
  --gray-300: #52525b;
  --gray-400: #71717a;
  --gray-500: #a1a1aa;
  --gray-600: #d4d4d8;
  --gray-700: #e4e4e7;
  --gray-800: #f4f4f5;
  --gray-900: #fafafa;
}
```

### Step 9: Add Neon theme CSS

```css
[data-theme="neon"] {
  /* Neon - Tokyo Night style */
  --background: #050505;
  --foreground: #c0caf5;
  --primary: #7aa2f7;
  /* Soft blue */
  --primary-light: #9ece6a;
  /* Lime accent */
  --surface: #16161e;
  --surface-hover: #1f2335;
  --border: #292e42;
}
```

### Step 10: Commit

```bash
git add src/app/globals.css
git commit -m "feat(themes): add 8 missing theme CSS definitions

Adds Midnight, Cherry, Forest, Nord, Dracula, Chocolate, Arctic,
and Neon themes to globals.css with authentic palettes."

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Task 2: Fix Lavender/Rose/Ocean Theme Variable Format

**Files:** `src/app/globals.css`

### Step 1: Read current Lavender/Rose/Ocean blocks

Find the Lavender, Rose, and Ocean blocks in `globals.css` (around lines 162-196). They currently use:
```css
--primary: 139, 92, 246;   /* raw RGB numbers - WRONG */
--primary-rgb: 139, 92, 246;
--card: ...;
--accent: ...;
```

Replace each with the standard format used by all other themes.

### Step 2: Fix Lavender

Change from:
```css
[data-theme="lavender"] {
  --primary: 139, 92, 246;
  --primary-rgb: 139, 92, 246;
  --background: #1a1625;
  --surface: #251f33;
  --foreground: #e9d5ff;
  --card: #2d2540;
  --border: #3d3555;
  --accent: #a78bfa;
}
```

To:
```css
[data-theme="lavender"] {
  --background: #1a1625;
  --foreground: #e9d5ff;
  --primary: #8b5cf6;
  /* Purple-500 */
  --primary-light: #a78bfa;
  /* Purple-400 */
  --surface: #251f33;
  --surface-hover: #2d2540;
  --border: #3d3555;
}
```

### Step 3: Fix Rose

Change from:
```css
[data-theme="rose"] {
  --primary: 244, 63, 94;
  --primary-rgb: 244, 63, 94;
  --background: #1a1518;
  --surface: #2a1f24;
  --foreground: #ffe4e6;
  --card: #352a30;
  --border: #4a3540;
  --accent: #fb7185;
}
```

To:
```css
[data-theme="rose"] {
  --background: #1a1518;
  --foreground: #ffe4e6;
  --primary: #f43f5e;
  /* Rose-500 */
  --primary-light: #fb7185;
  /* Rose-400 */
  --surface: #2a1f24;
  --surface-hover: #352a30;
  --border: #4a3540;
}
```

### Step 4: Fix Ocean

Change from:
```css
[data-theme="ocean"] {
  --primary: 6, 182, 212;
  --primary-rgb: 6, 182, 212;
  --background: #0c1929;
  --surface: #132f4c;
  --foreground: #b4e5f9;
  --card: #173a5e;
  --border: #265d97;
  --accent: #22d3ee;
}
```

To:
```css
[data-theme="ocean"] {
  --background: #0c1929;
  --foreground: #b4e5f9;
  --primary: #06b6d4;
  /* Cyan-500 */
  --primary-light: #22d3ee;
  /* Cyan-400 */
  --surface: #132f4c;
  --surface-hover: #173a5e;
  --border: #265d97;
}
```

### Step 5: Commit

```bash
git add src/app/globals.css
git commit -m "fix(themes): convert Lavender/Rose/Ocean to standard CSS variable format

Removes raw RGB number format and unused --card/--accent/--primary-rgb
variables. Uses hex primary colors matching existing theme patterns."

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Task 3: Fix FinanceView Hardcoded Colors

**Files:** `src/components/FinanceView.tsx`

### Step 1: Read affected lines

Read `src/components/FinanceView.tsx` around lines 530, 533, 539, 545, 934, 936, 1019.

### Step 2: Fix lines 530-545 (income/expense colors)

The colors `#22c55e` (green) and `#ef4444` (red) and `#f59e0b` (amber) are used for positive/negative values. These should remain as-is since they represent semantic data (green=money in, red=money out) rather than UI chrome. No change needed for these — they are data colors, not theme colors.

### Step 3: Fix line 934-936 (color values)

These are also data visualization colors. Check if they are in chart data or UI text. If they're chart colors used in FinanceCharts, leave them (charts have their own color scheme). If they're in UI text/backgrounds, replace with CSS variables.

### Step 4: Fix line 1019 `className="bg-[#111]"`

Change `className="bg-[#111]"` to `className="bg-surface"` or `style={{ background: 'var(--surface)' }}`. Verify what element this is on — if it's a modal/dialog background, use `var(--surface)`.

### Step 5: Commit

```bash
git add src/components/FinanceView.tsx
git commit -m "fix(themes): replace hardcoded surface bg in FinanceView

Fixes bg-[#111] to use var(--surface). Income/expense/chart colors
left as-is since they are semantic data colors."

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Task 4: Fix AnalysisComponents Hardcoded Colors

**Files:** `src/components/finance/AnalysisComponents.tsx`

### Step 1: Read affected lines

Read `src/components/finance/AnalysisComponents.tsx` around lines 52, 166, 318, 416, 424, 434, 444.

### Step 2: Categorize the colors

- Lines 52, 166, 318: These are chart/visualization colors (red/amber/green for financial metrics). If they're in chart components, leave them. If they're text colors in UI components, consider replacing.
- Lines 416, 424, 434, 444: These are text colors for error/warning/info/muted states in the UI. These should use CSS variables.

### Step 3: Fix UI text colors (lines 416-444)

For text colors used in UI messages:
- Line 416 `color: "#ef4444"` → `color: 'var(--error, #ef4444)'` or use a class
- Line 424 `color: "#f59e0b"` → `color: 'var(--warning, #f59e0b)'` or use a class
- Line 434 `color: "#3b82f6"` → `color: 'var(--info, #3b82f6)'` or use a class
- Line 444 `color: "#6b7280"` → `color: 'var(--gray-500)'` or `color: 'var(--muted, var(--gray-500))'`

Since the codebase doesn't have semantic variables like `--error` defined globally, use the gray scale for muted text:
- `color: '#6b7280'` → `color: 'var(--gray-500)'`

For error/warning/info, either add CSS variable definitions or use nearest equivalent:
- Error red → `var(--primary)` (since primary is red in Zen theme, but varies per theme)
- Warning amber → `var(--primary-light)` (amber tones work across warm themes)
- Info blue → `var(--primary)` (blue primary in light/sapphire/arctic)

Alternatively, just use `var(--foreground)` with opacity for muted text: `color: 'var(--gray-400)'` for muted.

### Step 4: Commit

```bash
git add src/components/finance/AnalysisComponents.tsx
git commit -m "fix(themes): replace hardcoded text colors in AnalysisComponents

Replaces hardcoded red/amber/gray text with var(--gray-500) and
var(--foreground) equivalents. Chart data colors left as-is."

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Task 5: Fix ExpenseTable Hardcoded Muted Color

**Files:** `src/components/finance/ExpenseTable.tsx`

### Step 1: Read line 211

Read `src/components/finance/ExpenseTable.tsx` around line 211. Find the `color: "#6b7280"` usage.

### Step 2: Fix

Change `color: "#6b7280"` to `color: 'var(--gray-500)'` (nearest equivalent — gray-500 is #6b7280).

### Step 3: Commit

```bash
git add src/components/finance/ExpenseTable.tsx
git commit -m "fix(themes): replace hardcoded muted color in ExpenseTable

Uses var(--gray-500) instead of hardcoded #6b7280."

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Task 6: Fix Canvas AIChatPanel Hardcoded Success/Error Colors

**Files:** `src/components/canvas/AIChatPanel.tsx`

### Step 1: Read affected lines

Read `src/components/canvas/AIChatPanel.tsx` around lines 331, 341, 420, 427.

### Step 2: Fix success color

Find `style={{ background: '#22c55e' }}` (green dot in header) and `style={{ color: '#22c55e' }}` (success check). Replace with `style={{ background: 'var(--primary)' }}` or better: use a CSS variable if the green dot represents "online/active" state. Since it's a status indicator (always green regardless of theme), keep it as a fixed color but make it a CSS variable:

Add to `:root` in globals.css:
```css
--color-success: #22c55e;
--color-error: #ef4444;
```

Then use `var(--color-success)` in the component. Or simpler: just use `var(--primary)` for the success checkmark and `var(--primary)` for the online indicator — but these aren't semantically correct.

Actually: status indicators (green=online, red=error) should use fixed semantic colors that don't change per theme, OR they should be theme-aware. For now, replace `#22c55e` with `var(--color-success)` and `#ef4444` with `var(--color-error)` — but these aren't defined yet.

Simpler fix: use `var(--primary)` for the green checkmark (primary is red in Zen, but this won't work for status). The cleanest approach is to add the semantic color variables to `:root`.

### Step 3: Add semantic color variables to globals.css

In `:root` (around line 31), add:
```css
--color-success: #22c55e;
--color-error: #ef4444;
--color-warning: #f59e0b;
--color-info: #3b82f6;
```

### Step 4: Use semantic variables in AIChatPanel

In AIChatPanel:
- Line 331 `background: '#22c55e'` → `background: 'var(--color-success)'`
- Line 341 `color: '#ef4444'` → `color: 'var(--color-error)'`
- Line 420 `color: '#22c55e'` → `color: 'var(--color-success)'`
- Line 427 `color: '#ef4444'` → `color: 'var(--color-error)'`

### Step 5: Commit

```bash
git add src/app/globals.css src/components/canvas/AIChatPanel.tsx
git commit -m "fix(themes): add semantic color variables and fix AIChatPanel

Adds --color-success, --color-error, --color-warning, --color-info to
:root. Replaces hardcoded status colors in AIChatPanel."

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Task 7: Fix CanvasNode and NodeModal Hardcoded Colors

**Files:** `src/components/canvas/CanvasNode.tsx`, `src/components/canvas/NodeModal.tsx`

### CanvasNode (lines 201, 211)

Line 201: `style={{ color: '#f97316' }}` — this is the "+ Add sub node" button text. Change to `style={{ color: 'var(--primary)' }}`.

Line 211: `style={{ color: '#ef4444' }}` — this is the "Delete" button text. Change to `style={{ color: 'var(--color-error, var(--primary))' }}` or just `style={{ color: 'var(--primary)' }}` for now.

### NodeModal (lines 84, 188, 195)

Line 84: `style={{ color: '#ef4444', background: '#ef444420' }}` — these are in a danger/destructive action area. Use `color: 'var(--color-error, var(--primary))'` and `background: 'color-mix(in srgb, var(--color-error, #ef4444) 12%, transparent)'`.

Line 188: `style={{ color: '#22c55e' }}` — success/apply button. Use `color: 'var(--color-success, var(--primary))'`.

Line 195: `style={{ color: '#ef4444' }}` — delete button. Use `color: 'var(--color-error, var(--primary))'`.

### Step 4: Commit

```bash
git add src/components/canvas/CanvasNode.tsx src/components/canvas/NodeModal.tsx
git commit -m "fix(themes): replace hardcoded action colors in CanvasNode and NodeModal

Uses var(--primary) and var(--color-error) instead of hardcoded
orange/red hex values for action buttons."

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Task 8: Fix ZCanvas Help Modal Hardcoded Primary Button

**Files:** `src/components/ZCanvas.tsx`

### Step 1: Read line 579

The help modal's "Got it, let's start" button has `style={{ background: '#dc2626', color: 'white' }}`.

### Step 2: Fix

Change to `style={{ background: 'var(--primary)', color: 'white' }}`.

### Step 3: Commit

```bash
git add src/components/ZCanvas.tsx
git commit -m "fix(themes): use var(--primary) for help modal button in ZCanvas

Replaces hardcoded #dc2626 with var(--primary). Also update
help text for the new shortcuts."

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Task 9: Fix Modal Surface Background Hardcoding

**Files:** `src/components/InboxView.tsx`, `src/components/NotesView.tsx`, `src/components/ShoppingListModal.tsx`

### InboxView (lines 99, 148, 161)

- Line 99: `className="bg-[#0f0f0f]"` → `className="bg-surface"` or `style={{ background: 'var(--surface)' }}`
- Line 148: `className="bg-[#1a1a1a]"` → `className="bg-surface"`
- Line 161: `className="bg-[#1a1a1a]"` → `className="bg-surface"`

### NotesView (lines 128, 340)

- Line 128: `className="bg-[#0f0f0f]"` → `className="bg-surface"`
- Line 340: `className="bg-[#1a1a1a]"` → `className="bg-surface"`

### ShoppingListModal (line 173)

- Line 173: `className="bg-[#1a1a1a]"` → `className="bg-surface"`

### Step 5: Commit

```bash
git add src/components/InboxView.tsx src/components/NotesView.tsx src/components/ShoppingListModal.tsx
git commit -m "fix(themes): replace hardcoded surface backgrounds in modals

Uses bg-surface class instead of bg-[#0f0f0f] and bg-[#1a1a1a]
in InboxView, NotesView, and ShoppingListModal."

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Task 10: Update Viewport themeColor Per Theme

**Files:** `src/app/page.tsx`

### Step 1: Read theme loading effect

Find the `useEffect` in `page.tsx` that loads the theme from localStorage (around line 1207-1209).

### Step 2: Update viewport themeColor

After setting `document.documentElement.setAttribute('data-theme', theme)`, also update the viewport themeColor. The current code only sets the data attribute.

Add after the data-theme line:
```ts
const theme = savedTheme || '';
const themeColors: Record<string, string> = {
  '': '#030303',       // Zen default
  'cyberpunk': '#050508',
  'matrix': '#000000',
  'sapphire': '#020617',
  'emerald': '#022c22',
  'sunset': '#1c1917',
  'light': '#ffffff',
  'arctic': '#f6f8fa',
  'lavender': '#1a1625',
  'rose': '#1a1518',
  'ocean': '#0c1929',
  'midnight': '#0a0a1a',
  'cherry': '#1a0a14',
  'forest': '#051a0d',
  'nord': '#2e3440',
  'dracula': '#282a36',
  'chocolate': '#1e1b18',
  'neon': '#050505',
};
const color = themeColors[theme] || '#030303';
document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color);
```

### Step 3: Also update the static viewport in layout.tsx

Read `src/app/layout.tsx`. The `viewport` export has `themeColor: "#030303"`. Keep this as the default (Zen), but the JS override from page.tsx will handle dynamic switching.

### Step 4: Commit

```bash
git add src/app/page.tsx
git commit -m "fix(themes): update viewport themeColor when theme changes

Sets meta[name='theme-color'] content dynamically based on selected
theme, so browser chrome/address bar matches the theme."

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Verification

After all tasks:
1. Open the app and go to Settings → Appearance
2. For each theme, verify:
   - Clicking a theme button changes the page immediately
   - The preview swatch colors roughly match the actual theme colors
   - Background, text, and borders change appropriately
   - The viewport color in the browser chrome changes
3. Go to Finance page — backgrounds should use var(--surface), not hardcoded #0f0f0f
4. Open InboxView, NotesView, ShoppingListModal — backgrounds should respect the theme
5. Open Canvas → help modal — "Got it" button should use theme primary color
6. Check no console errors related to unknown CSS variables
