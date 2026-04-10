import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending' | 'conflict';
}

interface Habit {
  id: string;
  name: string;
  frequency: string;
  completions: string[]; // ISO date strings
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending' | 'conflict';
}

interface PomodoroState {
  id: string;
  mode: 'work' | 'break' | 'idle';
  timeRemaining: number;
  sessionsCompleted: number;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending' | 'conflict';
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'synced' | 'pending' | 'conflict';
}

interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  entity: 'tasks' | 'habits' | 'pomodoro' | 'notes';
  data: Task | Habit | PomodoroState | Note;
  timestamp: string;
  status: 'pending' | 'processing' | 'failed';
}

interface OwenZenDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: { 'by-status': string; 'by-updated': string };
  };
  habits: {
    key: string;
    value: Habit;
    indexes: { 'by-updated': string };
  };
  pomodoro: {
    key: string;
    value: PomodoroState;
  };
  notes: {
    key: string;
    value: Note;
    indexes: { 'by-updated': string };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-timestamp': string; 'by-status': string };
  };
}

const DB_NAME = 'owen-zen-offline';
const DB_VERSION = 1;

let db: IDBPDatabase<OwenZenDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<OwenZenDB>> {
  if (db) return db;

  db = await openDB<OwenZenDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Tasks store
      if (!database.objectStoreNames.contains('tasks')) {
        const taskStore = database.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-status', 'syncStatus');
        taskStore.createIndex('by-updated', 'updatedAt');
      }

      // Habits store
      if (!database.objectStoreNames.contains('habits')) {
        const habitStore = database.createObjectStore('habits', { keyPath: 'id' });
        habitStore.createIndex('by-updated', 'updatedAt');
      }

      // Pomodoro store
      if (!database.objectStoreNames.contains('pomodoro')) {
        database.createObjectStore('pomodoro', { keyPath: 'id' });
      }

      // Notes store
      if (!database.objectStoreNames.contains('notes')) {
        const notesStore = database.createObjectStore('notes', { keyPath: 'id' });
        notesStore.createIndex('by-updated', 'updatedAt');
      }

      // Sync queue store
      if (!database.objectStoreNames.contains('syncQueue')) {
        const syncStore = database.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('by-timestamp', 'timestamp');
        syncStore.createIndex('by-status', 'status');
      }
    },
  });

  return db;
}

// ============ Task Operations ============

export async function getTasks(): Promise<Task[]> {
  const database = await getDB();
  return database.getAll('tasks');
}

export async function getTask(id: string): Promise<Task | undefined> {
  const database = await getDB();
  return database.get('tasks', id);
}

export async function saveTask(task: Task): Promise<void> {
  const database = await getDB();
  await database.put('tasks', { ...task, syncStatus: 'pending' });
  await addToSyncQueue('update', 'tasks', task);
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Task> {
  const now = new Date().toISOString();
  const newTask: Task = {
    ...task,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
  };
  const database = await getDB();
  await database.put('tasks', newTask);
  await addToSyncQueue('create', 'tasks', newTask);
  return newTask;
}

export async function deleteTask(id: string): Promise<void> {
  const database = await getDB();
  const task = await database.get('tasks', id);
  if (task) {
    await database.delete('tasks', id);
    await addToSyncQueue('delete', 'tasks', { id } as Task);
  }
}

export async function getPendingTasks(): Promise<Task[]> {
  const database = await getDB();
  return database.getAllFromIndex('tasks', 'by-status', 'pending');
}

// ============ Habit Operations ============

export async function getHabits(): Promise<Habit[]> {
  const database = await getDB();
  return database.getAll('habits');
}

export async function saveHabit(habit: Habit): Promise<void> {
  const database = await getDB();
  await database.put('habits', { ...habit, syncStatus: 'pending' });
  await addToSyncQueue('update', 'habits', habit);
}

export async function createHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Habit> {
  const now = new Date().toISOString();
  const newHabit: Habit = {
    ...habit,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
  };
  const database = await getDB();
  await database.put('habits', newHabit);
  await addToSyncQueue('create', 'habits', newHabit);
  return newHabit;
}

export async function logHabitCompletion(habitId: string, date: string): Promise<void> {
  const database = await getDB();
  const habit = await database.get('habits', habitId);
  if (habit) {
    if (!habit.completions.includes(date)) {
      habit.completions.push(date);
      habit.updatedAt = new Date().toISOString();
      habit.syncStatus = 'pending';
      await database.put('habits', habit);
      await addToSyncQueue('update', 'habits', habit);
    }
  }
}

// ============ Pomodoro Operations ============

export async function getPomodoroState(): Promise<PomodoroState | undefined> {
  const database = await getDB();
  const all = await database.getAll('pomodoro');
  return all[0];
}

export async function savePomodoroState(state: PomodoroState): Promise<void> {
  const database = await getDB();
  await database.put('pomodoro', { ...state, syncStatus: 'pending' });
  await addToSyncQueue('update', 'pomodoro', state);
}

export async function createPomodoroState(mode: 'work' | 'break' | 'idle' = 'idle', timeRemaining: number = 25 * 60): Promise<PomodoroState> {
  const state: PomodoroState = {
    id: 'pomodoro-state',
    mode,
    timeRemaining,
    sessionsCompleted: 0,
    updatedAt: new Date().toISOString(),
    syncStatus: 'pending',
  };
  const database = await getDB();
  await database.put('pomodoro', state);
  await addToSyncQueue('create', 'pomodoro', state);
  return state;
}

// ============ Note Operations ============

export async function getNotes(): Promise<Note[]> {
  const database = await getDB();
  return database.getAll('notes');
}

export async function saveNote(note: Note): Promise<void> {
  const database = await getDB();
  await database.put('notes', { ...note, syncStatus: 'pending' });
  await addToSyncQueue('update', 'notes', note);
}

export async function createNote(content: string): Promise<Note> {
  const now = new Date().toISOString();
  const note: Note = {
    id: crypto.randomUUID(),
    content,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending',
  };
  const database = await getDB();
  await database.put('notes', note);
  await addToSyncQueue('create', 'notes', note);
  return note;
}

export async function deleteNote(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('notes', id);
  await addToSyncQueue('delete', 'notes', { id } as Note);
}

// ============ Sync Queue Operations ============

async function addToSyncQueue(
  operation: 'create' | 'update' | 'delete',
  entity: 'tasks' | 'habits' | 'pomodoro' | 'notes',
  data: Task | Habit | PomodoroState | Note
): Promise<void> {
  const database = await getDB();
  const item: SyncQueueItem = {
    id: crypto.randomUUID(),
    operation,
    entity,
    data,
    timestamp: new Date().toISOString(),
    status: 'pending',
  };
  await database.put('syncQueue', item);
}

export async function getSyncQueueItems(): Promise<SyncQueueItem[]> {
  const database = await getDB();
  return database.getAllFromIndex('syncQueue', 'by-status', 'pending');
}

export async function processSyncQueue(apiEndpoint: string): Promise<{ success: number; failed: number }> {
  const database = await getDB();
  const items = await getSyncQueueItems();
  let success = 0;
  let failed = 0;

  for (const item of items) {
    try {
      // Mark as processing
      await database.put('syncQueue', { ...item, status: 'processing' });

      // Send to API
      const response = await fetch(`${apiEndpoint}/${item.entity}`, {
        method: item.operation === 'delete' ? 'DELETE' : item.operation === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item.data),
      });

      if (response.ok) {
        // Remove from queue on success
        await database.delete('syncQueue', item.id);

        // Update local item sync status
        if (item.entity !== 'pomodoro') {
          const localDb = await getDB();
          const localItem = await localDb.get(item.entity, (item.data as { id: string }).id);
          if (localItem) {
            await localDb.put(item.entity, { ...localItem, syncStatus: 'synced' });
          }
        }
        success++;
      } else {
        // Mark as failed but keep in queue
        await database.put('syncQueue', { ...item, status: 'failed' });
        failed++;
      }
    } catch (error) {
      // Network error - keep in queue for retry
      await database.put('syncQueue', { ...item, status: 'failed' });
      failed++;
    }
  }

  return { success, failed };
}

// ============ Online Status ============

const onlineHandlers = new Set<() => void>();

function handleOnline() {
  onlineHandlers.forEach(handler => handler());
}

export function onOnline(callback: () => void): () => void {
  if (onlineHandlers.size === 0) {
    window.addEventListener('online', handleOnline);
  }
  onlineHandlers.add(callback);
  return () => {
    onlineHandlers.delete(callback);
    if (onlineHandlers.size === 0) {
      window.removeEventListener('online', handleOnline);
    }
  };
}

export function isOnline(): boolean {
  return navigator.onLine;
}

// ============ Clear All Data ============

export async function clearAllData(): Promise<void> {
  const database = await getDB();
  await database.clear('tasks');
  await database.clear('habits');
  await database.clear('pomodoro');
  await database.clear('notes');
  await database.clear('syncQueue');
}