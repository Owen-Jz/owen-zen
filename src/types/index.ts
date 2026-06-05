export type TaskStatus = "pending" | "in-progress" | "completed" | "pinned" | "ai-agent" | "mind-map";
export type TaskPriority = "high" | "medium" | "low";

export interface SubTask {
    title: string;
    completed: boolean;
    description?: string;
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
    images?: string[];
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
    isBanked?: boolean;
    quadrant?: 'q1' | 'q2' | 'q3' | 'q4' | null;
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

export interface ProjectTag {
    name: string;
    color: string; // hex e.g. "#ef4444"
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
    notes?: string[];
    links: ProjectLink[];
    createdAt: string;
    taskCount?: number;
    completedTaskCount?: number;
    tags?: ProjectTag[];
    estimatedHours?: number;
    teamMembers?: string[];
    quadrant?: "q1" | "q2" | "q3" | "q4" | null;
    notesRichText?: string; // Tiptap HTML
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

export interface CommunicationPrefs {
    preferredContactMethod?: 'email' | 'phone' | 'slack' | 'video' | 'other';
    bestTimeToContact?: string;
    timezone?: string;
    communicationStyle?: string;
}

export interface Session {
    _id?: string;
    date: string;
    summary: string;
    followUps: string[];
    nextSteps?: string;
}

export interface HourEntry {
  _id: string;
  date: string;          // YYYY-MM-DD
  hour: number;          // 0–23
  text: string;
  type: 'deep-work' | 'routine' | 'meetings' | 'breaks' | 'distracted' | 'default';
  isPlanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    role?: string;
    communicationPrefs: CommunicationPrefs;
    personalNotes?: string;
    projects: string[];
    sessions: Session[];
    tags: string[];
    status: 'active' | 'dormant' | 'needs-followup';
    createdAt: string;
    updatedAt: string;
}
