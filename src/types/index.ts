export type TaskStatus = "pending" | "in-progress" | "completed" | "pinned" | "ai-agent" | "mind-map";
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
    projectId?: string;
    isMIT: boolean;
    scheduledDate?: string; // ISO string 
    dueDate?: string;      // ISO string
    googleEventId?: string;
    isTemp?: boolean;
    overdueNotified?: boolean;
    category?: string;
    completedAt?: string;
}

export interface ProjectDeliverable {
    _id?: string;
    title: string;
    completed: boolean;
}

export interface ProjectLink {
    _id?: string;
    title: string;
    url: string;
}

export interface Project {
    _id: string;
    title: string;
    description?: string;
    category: "design" | "development" | "business" | "personal";
    status: "planning" | "active" | "paused" | "completed";
    priority: "high" | "medium" | "low";
    progress: number;
    startDate?: string;
    dueDate?: string;
    deliverables: ProjectDeliverable[];
    links: ProjectLink[];
    createdAt: string;
    taskCount?: number;
    completedTaskCount?: number;
}

export interface Note {
    _id: string;
    userId: string;
    title: string;
    content: string;
    isPinned: boolean;
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
}
