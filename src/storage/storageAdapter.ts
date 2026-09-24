import { Task, StorageData, STORAGE_VERSION, Priority, TaskStatus } from '../types/task';

export type { Task, StorageData };

/**
 * Storage key for localStorage
 */
const STORAGE_KEY = 'taskflow_tasks';

/**
 * Debounce delay in milliseconds
 */
const DEBOUNCE_DELAY = 500;

/**
 * LocalStorage quota (typically 5-10MB)
 */
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Storage adapter interface
 * Abstracts storage operations to allow switching between localStorage and remote API
 */
export interface IStorageAdapter {
  load(): Promise<StorageData>;
  save(data: StorageData): Promise<void>;
  clear(): Promise<void>;
}

/**
 * LocalStorage storage adapter
 * Handles persistence with versioning, debouncing, and migration
 */
export class LocalStorageAdapter implements IStorageAdapter {
  private debounceTimer: number | null = null;
  private pendingSave: StorageData | null = null;

  /**
   * Load tasks from localStorage
   * Handles migration if version mismatch
   */
  async load(): Promise<StorageData> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return this.getEmptyStorage();
      }

      const data: StorageData = JSON.parse(raw);
      
      // Check if migration is needed
      if (data.version !== STORAGE_VERSION) {
        return this.migrate(data);
      }

      return data;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return this.getEmptyStorage();
    }
  }

  /**
   * Save tasks to localStorage with debouncing
   */
  async save(data: StorageData): Promise<void> {
    this.pendingSave = { ...data, version: STORAGE_VERSION };

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.performSave();
    }, DEBOUNCE_DELAY);
  }

  /**
   * Clear all tasks from localStorage
   */
  async clear(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
      throw error;
    }
  }

  /**
   * Perform the actual save operation
   */
  private performSave(): void {
    if (!this.pendingSave) return;

    try {
      const serialized = JSON.stringify(this.pendingSave);
      
      // Check storage size
      if (serialized.length > MAX_STORAGE_SIZE) {
        console.warn('Storage size approaching limit');
      }

      localStorage.setItem(STORAGE_KEY, serialized);
      this.pendingSave = null;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      
      // Handle quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded();
      }
    }
  }

  /**
   * Handle storage quota exceeded
   * Removes oldest completed tasks to free space
   */
  private handleQuotaExceeded(): void {
    if (!this.pendingSave) return;

    const tasks = this.pendingSave.tasks;
    const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);
    
    if (completedTasks.length > 0) {
      // Remove oldest completed task
      const oldestCompleted = completedTasks.sort(
        (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      )[0];
      
      this.pendingSave.tasks = tasks.filter(t => t.id !== oldestCompleted.id);
      
      // Retry save
      this.performSave();
    }
  }

  /**
   * Migrate data from old version to new version
   */
  private migrate(data: StorageData): StorageData {
    console.log(`Migrating from version ${data.version} to ${STORAGE_VERSION}`);

    // Migration from v1 to v2
    if (data.version === 1) {
      return this.migrateV1ToV2(data);
    }

    // If version is unknown, return empty storage
    return this.getEmptyStorage();
  }

  /**
   * Migration from v1 to v2
   * v1 had: id, title, completed, createdAt
   * v2 adds: notes, dueDate, priority, tags, status, updatedAt, order
   */
  private migrateV1ToV2(data: StorageData): StorageData {
    const migratedTasks: Task[] = data.tasks.map((task: any) => ({
      id: task.id,
      title: task.title,
      notes: '',
      dueDate: undefined,
      priority: Priority.MEDIUM,
      tags: [],
      status: task.completed ? TaskStatus.COMPLETED : TaskStatus.ACTIVE,
      createdAt: task.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: 0,
    }));

    return {
      version: STORAGE_VERSION,
      tasks: migratedTasks,
    };
  }

  /**
   * Get empty storage structure
   */
  private getEmptyStorage(): StorageData {
    return {
      version: STORAGE_VERSION,
      tasks: [],
    };
  }

  /**
   * Force immediate save (bypass debounce)
   */
  async forceSave(data: StorageData): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.pendingSave = { ...data, version: STORAGE_VERSION };
    this.performSave();
  }
}

/**
 * Create storage adapter instance
 */
export const storageAdapter = new LocalStorageAdapter();
