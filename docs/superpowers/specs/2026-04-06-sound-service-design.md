# Sound Service Design

## Overview

A lightweight sound effects system for Owen Zen that plays audio feedback on platform events (task completion, habit tracking, pomodoro sessions, etc.) with a global mute toggle.

## File Structure

```
src/
  hooks/
    useSound.ts              # Main React hook
  lib/
    soundService.ts          # Core audio playback logic
    soundEvents.ts            # Event-to-sound mappings and type definitions

public/
  sounds/                    # Audio files moved from audio_backup/
    taskCompleted.mp3
    success.mp3
    ...
```

## Sound Event Mapping

### Tasks
| Event | Sound |
|-------|-------|
| TASK_COMPLETED | taskCompleted.mp3 |
| TASK_CREATED | save.mp3 |
| TASK_MOVED | diffLineModified.mp3 |
| TASK_DELETED | clear.mp3 |
| TASK_PINNED | foldedAreas.mp3 |
| TASK_UNPINNED | foldedAreas.mp3 |
| TASK_PRIORITY_CHANGED | diffLineInserted.mp3 |
| SUBTASK_COMPLETED | taskCompleted.mp3 |
| TASK_MIT | success.mp3 |
| TASK_DEADLINE_WARNING | warning.mp3 |
| TASK_OVERDUE | error.mp3 |
| TASK_UNBLOCKED | terminalCommandSucceeded.mp3 |

### Habits
| Event | Sound |
|-------|-------|
| HABIT_COMPLETED | taskCompleted.mp3 |
| HABIT_STREAK_BROKEN | taskFailed.mp3 |
| HABIT_CREATED | save.mp3 |
| HABIT_STREAK_MILESTONE | success.mp3 |
| HABIT_DAILY_GOAL | progress.mp3 |

### Pomodoro
| Event | Sound |
|-------|-------|
| POMODORO_STARTED | requestSent.mp3 |
| POMODORO_COMPLETE | break.mp3 |
| BREAK_STARTED | progress.mp3 |
| BREAK_ENDED | terminalBell.mp3 |
| LONG_BREAK_EARNED | success.mp3 |
| DEEP_WORK_GOAL | antigravityCascadeDone.mp3 |

### Goals
| Event | Sound |
|-------|-------|
| GOAL_ACHIEVED | success.mp3 |
| GOAL_CREATED | save.mp3 |
| GOAL_PROGRESS | progress.mp3 |
| IDEA_CAPTURED | save.mp3 |

### Notes & Content
| Event | Sound |
|-------|-------|
| NOTE_SAVED | save.mp3 |
| NOTE_DELETED | clear.mp3 |
| NOTE_ARCHIVED | editsKept.mp3 |
| CONTENT_SCHEDULED | save.mp3 |

### AI Chat
| Event | Sound |
|-------|-------|
| AI_RESPONSE_RECEIVED | responseReceived1.mp3 (rotates 1-4) |
| AI_ACTION_REQUIRED | chatUserActionRequired.mp3 |
| AI_CHAT_FILE_MODIFIED | chatEditModifiedFile.mp3 |
| AI_REQUEST_SENT | requestSent.mp3 |

### Finance
| Event | Sound |
|-------|-------|
| EXPENSE_LOGGED | save.mp3 |
| INCOME_LOGGED | save.mp3 |
| BUDGET_EXCEEDED | warning.mp3 |
| BUDGET_CREATED | save.mp3 |

### Gym
| Event | Sound |
|-------|-------|
| GYM_SESSION_LOGGED | taskCompleted.mp3 |
| GYM_PR | antigravityCascadeDone.mp3 |

### Projects
| Event | Sound |
|-------|-------|
| PROJECT_CREATED | save.mp3 |
| PROJECT_STATUS_CHANGED | diffLineModified.mp3 |
| PROJECT_COMPLETED | success.mp3 |
| DELIVERABLE_COMPLETED | taskCompleted.mp3 |

### General
| Event | Sound |
|-------|-------|
| INBOX_CLEARED | clear.mp3 |
| QUICK_LINK_SAVED | save.mp3 |
| BUCKET_LIST_ACHIEVED | success.mp3 |
| LEAD_CONVERTED | taskCompleted.mp3 |
| DAILY_SUMMARY_READY | terminalBell.mp3 |
| GENERIC_SUCCESS | success.mp3 |
| GENERIC_WARNING | warning.mp3 |
| GENERIC_ERROR | error.mp3 |
| GENERIC_SAVE | save.mp3 |
| GENERIC_CLEAR | clear.mp3 |

## Type Definitions

```typescript
// src/lib/soundEvents.ts

export type SoundEvent =
  | 'TASK_COMPLETED' | 'TASK_CREATED' | 'TASK_MOVED' | 'TASK_DELETED'
  | 'TASK_PINNED' | 'TASK_UNPINNED' | 'TASK_PRIORITY_CHANGED'
  | 'SUBTASK_COMPLETED' | 'TASK_MIT' | 'TASK_DEADLINE_WARNING' | 'TASK_OVERDUE'
  | 'TASK_UNBLOCKED'
  | 'HABIT_COMPLETED' | 'HABIT_STREAK_BROKEN' | 'HABIT_CREATED'
  | 'HABIT_STREAK_MILESTONE' | 'HABIT_DAILY_GOAL'
  | 'POMODORO_STARTED' | 'POMODORO_COMPLETE' | 'BREAK_STARTED' | 'BREAK_ENDED'
  | 'LONG_BREAK_EARNED' | 'DEEP_WORK_GOAL'
  | 'GOAL_ACHIEVED' | 'GOAL_CREATED' | 'GOAL_PROGRESS' | 'IDEA_CAPTURED'
  | 'NOTE_SAVED' | 'NOTE_DELETED' | 'NOTE_ARCHIVED' | 'CONTENT_SCHEDULED'
  | 'AI_RESPONSE_RECEIVED' | 'AI_ACTION_REQUIRED'
  | 'AI_CHAT_FILE_MODIFIED' | 'AI_REQUEST_SENT'
  | 'EXPENSE_LOGGED' | 'INCOME_LOGGED' | 'BUDGET_EXCEEDED' | 'BUDGET_CREATED'
  | 'GYM_SESSION_LOGGED' | 'GYM_PR'
  | 'PROJECT_CREATED' | 'PROJECT_STATUS_CHANGED' | 'PROJECT_COMPLETED'
  | 'DELIVERABLE_COMPLETED'
  | 'INBOX_CLEARED' | 'QUICK_LINK_SAVED' | 'BUCKET_LIST_ACHIEVED'
  | 'LEAD_CONVERTED' | 'DAILY_SUMMARY_READY'
  | 'GENERIC_SUCCESS' | 'GENERIC_WARNING' | 'GENERIC_ERROR'
  | 'GENERIC_SAVE' | 'GENERIC_CLEAR';

export const soundEventMap: Record<SoundEvent, string> = {
  // Tasks
  TASK_COMPLETED: '/sounds/taskCompleted.mp3',
  TASK_CREATED: '/sounds/save.mp3',
  TASK_MOVED: '/sounds/diffLineModified.mp3',
  TASK_DELETED: '/sounds/clear.mp3',
  TASK_PINNED: '/sounds/foldedAreas.mp3',
  TASK_UNPINNED: '/sounds/foldedAreas.mp3',
  TASK_PRIORITY_CHANGED: '/sounds/diffLineInserted.mp3',
  SUBTASK_COMPLETED: '/sounds/taskCompleted.mp3',
  TASK_MIT: '/sounds/success.mp3',
  TASK_DEADLINE_WARNING: '/sounds/warning.mp3',
  TASK_OVERDUE: '/sounds/error.mp3',
  TASK_UNBLOCKED: '/sounds/terminalCommandSucceeded.mp3',
  // Habits
  HABIT_COMPLETED: '/sounds/taskCompleted.mp3',
  HABIT_STREAK_BROKEN: '/sounds/taskFailed.mp3',
  HABIT_CREATED: '/sounds/save.mp3',
  HABIT_STREAK_MILESTONE: '/sounds/success.mp3',
  HABIT_DAILY_GOAL: '/sounds/progress.mp3',
  // Pomodoro
  POMODORO_STARTED: '/sounds/requestSent.mp3',
  POMODORO_COMPLETE: '/sounds/break.mp3',
  BREAK_STARTED: '/sounds/progress.mp3',
  BREAK_ENDED: '/sounds/terminalBell.mp3',
  LONG_BREAK_EARNED: '/sounds/success.mp3',
  DEEP_WORK_GOAL: '/sounds/antigravityCascadeDone.mp3',
  // Goals
  GOAL_ACHIEVED: '/sounds/success.mp3',
  GOAL_CREATED: '/sounds/save.mp3',
  GOAL_PROGRESS: '/sounds/progress.mp3',
  IDEA_CAPTURED: '/sounds/save.mp3',
  // Notes
  NOTE_SAVED: '/sounds/save.mp3',
  NOTE_DELETED: '/sounds/clear.mp3',
  NOTE_ARCHIVED: '/sounds/editsKept.mp3',
  CONTENT_SCHEDULED: '/sounds/save.mp3',
  // AI Chat
  AI_RESPONSE_RECEIVED: '/sounds/responseReceived1.mp3',
  AI_ACTION_REQUIRED: '/sounds/chatUserActionRequired.mp3',
  AI_CHAT_FILE_MODIFIED: '/sounds/chatEditModifiedFile.mp3',
  AI_REQUEST_SENT: '/sounds/requestSent.mp3',
  // Finance
  EXPENSE_LOGGED: '/sounds/save.mp3',
  INCOME_LOGGED: '/sounds/save.mp3',
  BUDGET_EXCEEDED: '/sounds/warning.mp3',
  BUDGET_CREATED: '/sounds/save.mp3',
  // Gym
  GYM_SESSION_LOGGED: '/sounds/taskCompleted.mp3',
  GYM_PR: '/sounds/antigravityCascadeDone.mp3',
  // Projects
  PROJECT_CREATED: '/sounds/save.mp3',
  PROJECT_STATUS_CHANGED: '/sounds/diffLineModified.mp3',
  PROJECT_COMPLETED: '/sounds/success.mp3',
  DELIVERABLE_COMPLETED: '/sounds/taskCompleted.mp3',
  // General
  INBOX_CLEARED: '/sounds/clear.mp3',
  QUICK_LINK_SAVED: '/sounds/save.mp3',
  BUCKET_LIST_ACHIEVED: '/sounds/success.mp3',
  LEAD_CONVERTED: '/sounds/taskCompleted.mp3',
  DAILY_SUMMARY_READY: '/sounds/terminalBell.mp3',
  GENERIC_SUCCESS: '/sounds/success.mp3',
  GENERIC_WARNING: '/sounds/warning.mp3',
  GENERIC_ERROR: '/sounds/error.mp3',
  GENERIC_SAVE: '/sounds/save.mp3',
  GENERIC_CLEAR: '/sounds/clear.mp3',
};
```

## Architecture

### SoundContext
- Holds `isMuted: boolean` state
- Initialized from localStorage on mount
- Provides `setMuted(bool)` function
- Persists to localStorage on change

### SoundProvider
- Wraps the app (layout.tsx)
- Manages mute state
- Renders mute toggle button (speaker icon)

### useSound Hook
```typescript
const { playSound } = useSound();
playSound('TASK_COMPLETED');
```

### soundService
```typescript
playSound(event: SoundEvent): void
```

## Implementation Steps

1. Move audio files from `audio_backup/` to `public/sounds/`
2. Create `src/lib/soundEvents.ts` with type definitions and mappings
3. Create `src/lib/soundService.ts` with audio playback logic
4. Create `src/hooks/useSound.ts` React hook
5. Create `src/components/SoundProvider.tsx` with mute toggle
6. Integrate SoundProvider into layout
7. Add mute toggle to header
8. Wire up sounds to existing components (tasks, habits, pomodoro, etc.)

## Notes

- AI_RESPONSE_RECEIVED cycles through responseReceived1-4 for variety
- Audio files use lazy loading (preload="none") for performance
- Audio objects are cached in a Map after first play
