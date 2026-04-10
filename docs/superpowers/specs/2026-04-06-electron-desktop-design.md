# Electron Desktop App for Owen Zen

**Date:** 2026-04-06
**Status:** Approved for implementation

## Overview

Wrap Owen Zen as an Electron desktop application while preserving the existing web app. Both versions share the same codebase - Electron adds native desktop features (system tray, notifications, auto-start, global hotkey) and offline-first capability via local caching with sync queue.

## Architecture

```
owen-zen/
├── electron/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Context bridge (IPC)
│   └── tray.ts              # System tray management
├── src/
│   └── (existing Next.js app unchanged)
├── package.json             # Merged - adds electron scripts
└── docs/superpowers/specs/2026-04-06-electron-desktop-design.md
```

**Key principle:** The `src/` folder is the same for both web and desktop. Electron imports and runs the Next.js app.

## Offline Caching

**Storage:** IndexedDB via `idb` library (lightweight wrapper)

| Data Type | Storage | Sync Strategy |
|-----------|---------|----------------|
| Tasks | IndexedDB `tasks` store | Queue & replay on reconnect |
| Habits | IndexedDB `habits` store | Queue & replay on reconnect |
| Pomodoro | IndexedDB `pomodoro` store | Queue & replay on reconnect |
| Notes | IndexedDB `notes` store | Queue & replay on reconnect |

**Sync Queue:** IndexedDB `syncQueue` store
- Each entry: `{ id, operation, entity, data, timestamp, status }`
- On reconnect: replay in FIFO order, handle conflicts

## Desktop Features

### System Tray
- **Icon:** App icon (same as PWA)
- **Click:** Show/restore window
- **Close (X):** Minimize to tray (app keeps running)
- **Context menu:** Show / Start Pomodoro / Quit

### Auto-Start
- Register on OS login via `electron autostart` or registry
- Starts **minimized to tray** (no window on launch)

### Global Hotkey
- `Ctrl+Shift+O` - summon app from anywhere

### Native Notifications
- Pomodoro work session complete
- Pomodoro break complete
- Sync errors

## Security

- `nodeIntegration: false`
- `contextIsolation: true`
- All IPC through `preload.ts` context bridge

## Development Workflow

```bash
# Web (existing)
npm run dev

# Desktop (new)
npm run electron:dev    # Start Electron with hot reload
npm run electron:build   # Build production .exe
```

## Build Targets

- **Windows:** `.exe` installer via electron-builder
- **macOS:** `.dmg` (future)
- **Output:** `dist/Owen Zen Setup.exe`

## Implementation Order

1. Set up Electron scaffolding with main + preload
2. Verify Electron can load Next.js dev server
3. Add system tray with context menu
4. Implement global hotkey
5. Add auto-start registration
6. Build IndexedDB offline caching layer
7. Implement sync queue with queue & replay
8. Add native notifications for Pomodoro
9. Configure electron-builder for production build
10. Test and polish

## Dependencies to Add

```json
{
  "electron": "^28.0.0",
  "electron-builder": "^24.0.0",
  "electron-start": "^1.0.0",
  "idb": "^8.0.0"
}
```