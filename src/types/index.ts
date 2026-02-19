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
    accumulatedTime?: number;
}

export interface Board {
    _id: string;
    title: string;
}

export interface Task {
    _id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    createdAt: string;
    order: number;
    isArchived?: boolean;
    subtasks?: SubTask[];
    timeLogs?: TimeLog[];
    totalTimeSpent?: number;
    activeTimer?: ActiveTimer;
    boardId?: string;
    isMIT: boolean;
    scheduledDate?: string; // or Date
}
