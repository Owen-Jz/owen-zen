// Types
export type TaskStatus = "pending" | "in-progress" | "completed" | "pinned";
export type TaskPriority = "high" | "medium" | "low";

export interface SubTask {
  title: string;
  completed: boolean;
}

export interface TimeLog {
  startedAt: string;
  endedAt?: string;
  duration: number; // seconds
  note?: string;
}

export interface ActiveTimer {
  startedAt?: string;
  isActive: boolean;
  sessionTitle?: string;
}

export interface Task {
  _id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string;
  order: number;
  isArchived?: boolean;
  subtasks?: SubTask[];
  timeLogs?: TimeLog[];
  totalTimeSpent?: number;
  activeTimer?: ActiveTimer;
  isMIT: boolean;
  scheduledDate?: Date;
  googleEventId?: string;
}
