# Electron Desktop App Completion Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans to implement.

**Goal:** Complete the Electron desktop app for Owen Zen so `npm run electron:dev` runs the app in development and `npm run electron:build` produces a working `.exe`.

**Architecture:** Electron wraps the Next.js app. In dev mode, it loads `http://localhost:3000`. In production, it loads the built Next.js static output. The same `src/` codebase is shared between web and desktop.

**Tech Stack:** Electron 35, electron-builder 26, esbuild, Next.js 16, idb (IndexedDB), TypeScript.

---

## File Map

| File | Role |
|------|------|
| `electron/main.ts` | Main process - window, tray, hotkey, IPC |
| `electron/preload.ts` | Context bridge for renderer IPC |
| `electron/build.js` | esbuild compiler for main + preload |
| `electron/tsconfig.json` | TypeScript config for Electron |
| `dist-electron/main.js` | Compiled main (generated) |
| `dist-electron/preload.js` | Compiled preload (generated) |
| `src/lib/offlineStorage.ts` | IndexedDB + sync queue (done) |
| `src/lib/soundEvents.ts` | Sound event types + mappings (done) |
| `src/lib/soundService.ts` | Audio playback (done) |
| `src/components/SoundEffects.tsx` | SoundProvider + useSound hook (done) |
| `src/components/MuteToggle.tsx` | Mute button (done) |
| `src/components/Providers.tsx` | Wraps app in SoundProvider (done) |
| `public/sounds/*.mp3` | Audio files (done) |
| `package.json` | Electron scripts + dependencies |

---

## Tasks

### Task 1: Verify `idb` dependency is installed

**Files:** `package.json`

- [ ] **Step 1: Check if `idb` is in dependencies**

Run: `grep '"idb"' package.json`
Expected: `"idb": "^8.0.0"` or similar

If missing:
Run: `npm install idb@^8.0.0`
Then add to `package.json` dependencies manually if needed.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add idb dependency for offline storage"
```

---

### Task 2: Fix Electron production build path

**Files:** `electron/main.ts:47`

The production load path is wrong for Next.js 16 App Router.

- [ ] **Step 1: Identify correct Next.js build output**

Next.js 16 with `output: 'export'` (for desktop) produces static files. Without export, it uses server-side rendering. For Electron, we need a static export.

Check if `next.config.ts` has `output: 'export'`:
Run: `grep -n "output.*export" next.config.ts 2>/dev/null || echo "not found"`

- [ ] **Step 2: Update `electron/main.ts` loadFile path**

The current path `.next/server/app/index.html` is incorrect. For Next.js 16 App Router with server mode (no static export), Electron should load from `.next/server/app/index.html`. However, this file may not exist as a raw HTML file.

A more reliable approach for Electron with Next.js 16:
```typescript
// Replace the else branch in loadFile
mainWindow.loadFile(path.join(__dirname, '../.next/server/app/index.html'));
```

Should be changed to load the proper Next.js build:
```typescript
mainWindow.loadURL(`file://${path.join(__dirname, '../.next/server/app/index.html')}`);
```

Or better yet, add `output: 'export'` to `next.config.ts` and load from `.next/exported/index.html`.

**Decision needed from you:** Does the app need `output: 'export'` (static HTML export) or should Electron use a dev-server approach in production too?

For now, update to the correct path based on your Next.js config. Run `ls .next/server/app/` to see what's there after a build.

---

### Task 3: Fix `getIconPath` in electron/main.ts

**Files:** `electron/main.ts:19-21`

- [ ] **Step 1: Verify icon path**

Current code:
```typescript
function getIconPath(): string {
  return path.join(__dirname, '../public/icon.png');
}
```

From `dist-electron/` the path `../public/icon.png` resolves to `public/icon.png` which exists. However, in the packaged app (when running from `resources/`), this relative path breaks.

Update to use `process.resourcesPath` for production:
```typescript
function getIconPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'public/icon.png');
  }
  return path.join(__dirname, '../public/icon.png');
}
```

- [ ] **Step 2: Commit**

```bash
git add electron/main.ts
git commit -m "fix(electron): use process.resourcesPath for icon in packaged app"
```

---

### Task 4: Add `electron:dev` startup script validation

**Files:** `package.json:13`, `electron/build.js`

- [ ] **Step 1: Verify the electron:dev script works**

Current script:
```json
"electron:dev": "npm run electron:compile && concurrently \"wait-on http://localhost:3000 && next dev\" \"wait-on http://localhost:3000 && electron .\""
```

This starts `next dev` AND `electron .` concurrently, both waiting for port 3000. However, `electron .` runs the compiled `dist-electron/main.js` which loads `http://localhost:3000`.

The problem: `electron .` won't wait for `next dev` to be truly ready — `wait-on` only checks TCP, not HTTP 200.

- [ ] **Step 2: Update script to use `wait-on http://localhost:3000` before starting electron only**

```json
"electron:dev": "npm run electron:compile && concurrently \"next dev\" \"wait-on http://localhost:3000 && electron .\""
```

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "fix(electron): correct electron:dev to wait for next dev server"
```

---

### Task 5: Update electron-builder config for Next.js 16

**Files:** `package.json:60-82`

The current `files` configuration may not include all needed Next.js build artifacts.

- [ ] **Step 1: Update electron-builder files config**

Replace the `files` array with:
```json
"files": [
  "dist-electron/**/*",
  ".next/**/*",
  "public/**/*",
  "!node_modules/**/*",
  "node_modules/idb/**/*"
]
```

This ensures the Next.js build output and idb are packaged.

- [ ] **Step 2: Add `asar: true` for security**

Add `"asar": true` to the build config (packaging Electron into an archive is standard).

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "fix(electron): update electron-builder config for Next.js 16 production build"
```

---

### Task 6: Test electron:dev workflow

**Files:** (no changes, validation only)

- [ ] **Step 1: Run electron dev mode**

Run: `npm run electron:dev`
Expected: Terminal shows `[Electron] App ready, starting Owen Zen...`, browser window opens with the app at `http://localhost:3000`.

If successful, the Electron window should display the Next.js app.

- [ ] **Step 2: Verify tray icon appears**

The system tray should show an icon. Click should toggle the window.

- [ ] **Step 3: Verify global hotkey works**

Press `Ctrl+Shift+O` from any application. Owen Zen window should appear/focus.

---

### Task 7: Test electron:build workflow

**Files:** (no changes, validation only)

- [ ] **Step 1: Run production build**

Run: `npm run electron:build`
Expected: Compiles TypeScript, runs `next build`, then electron-builder packages the app. `dist/Owen Zen Setup.exe` is created.

- [ ] **Step 2: Verify the .exe exists**

Run: `ls dist/*.exe 2>/dev/null || ls dist/`
Expected: `Owen Zen Setup.exe` in `dist/` folder.

---

## Spec Coverage Checklist

| Spec Requirement | Task |
|-----------------|------|
| Electron scaffolding | ✅ Done (existing files) |
| Electron loads Next.js dev server | Task 4 |
| System tray with context menu | ✅ Done (existing) |
| Global hotkey `Ctrl+Shift+O` | ✅ Done (existing) |
| Auto-start on login | ✅ Done (existing) |
| Native notifications for Pomodoro | ✅ Done (existing) |
| IndexedDB offline caching | ✅ Done (offlineStorage.ts) |
| Sync queue with queue & replay | ✅ Done (offlineStorage.ts) |
| Production `.exe` build | Tasks 2, 3, 5, 7 |
| `output: 'export'` for static HTML | Task 2 (pending your decision) |

---

## Open Question

**Next.js output mode:** Does your `next.config.ts` have `output: 'export'`? This determines how Electron loads the app in production. Static export means Electron loads `.next/exported/index.html` directly. Server mode means Electron needs to either (a) run `next start` alongside Electron, or (b) use the server-side HTML.

Without `output: 'export'`, the most reliable approach for a desktop app is to keep a dev-server running. For a fully offline desktop app, `output: 'export'` is recommended.

Please confirm your `next.config.ts` settings or let me choose the static export approach (which makes the app fully offline).
