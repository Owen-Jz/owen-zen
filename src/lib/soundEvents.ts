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
  | 'GENERIC_SAVE' | 'GENERIC_CLEAR'
  | 'TASK_MODAL_OPENED' | 'TASK_MODAL_CLOSED';

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
  TASK_MODAL_OPENED: '/sounds/terminalCommandSucceeded.mp3',
  TASK_MODAL_CLOSED: '/sounds/foldedAreas.mp3',
};
