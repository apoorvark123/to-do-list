import { IStorageAdapter, StorageData, Task } from './storageAdapter';

/**
 * Conflict resolution strategies
 */
export enum ConflictResolution {
  LAST_WRITE_WINS = 'last-write-wins',
  MERGE = 'merge',
  MANUAL = 'manual',
}

/**
 * API Storage Adapter
 * Implements storage adapter interface for remote API sync
 * Supports conflict resolution and offline handling
 */
export class ApiStorageAdapter implements IStorageAdapter {
  private baseUrl: string;
  private conflictResolution: ConflictResolution;
  private localCache: StorageData | null = null;

  constructor(
    baseUrl: string = '/api/tasks',
    conflictResolution: ConflictResolution = ConflictResolution.LAST_WRITE_WINS
  ) {
    this.baseUrl = baseUrl;
    this.conflictResolution = conflictResolution;
  }

  /**
   * Load tasks from remote API
   * Falls back to local cache if offline
   */
  async load(): Promise<StorageData> {
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: StorageData = await response.json();
      this.localCache = data;
      return data;
    } catch (error) {
      console.error('Failed to load from API, using cache:', error);
      if (this.localCache) {
        return this.localCache;
      }
      // Return empty storage if no cache
      return { version: 2, tasks: [] };
    }
  }

  /**
   * Save tasks to remote API
   * Implements conflict resolution based on strategy
   */
  async save(data: StorageData): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const serverData: StorageData = await response.json();

      // Handle conflicts if server data differs
      if (this.hasConflict(data, serverData)) {
        const resolvedData = await this.resolveConflict(data, serverData);
        await this.save(resolvedData);
      } else {
        this.localCache = serverData;
      }
    } catch (error) {
      console.error('Failed to save to API:', error);
      // Save to local cache for offline support
      this.localCache = data;
      // Could implement queue for later sync
    }
  }

  /**
   * Clear all tasks from remote API
   */
  async clear(): Promise<void> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.localCache = { version: 2, tasks: [] };
    } catch (error) {
      console.error('Failed to clear from API:', error);
      throw error;
    }
  }

  /**
   * Check if there's a conflict between local and server data
   */
  private hasConflict(local: StorageData, server: StorageData): boolean {
    if (local.tasks.length !== server.tasks.length) return true;
    
    // Check if any task has been modified on server
    for (const localTask of local.tasks) {
      const serverTask = server.tasks.find(t => t.id === localTask.id);
      if (!serverTask) return true;
      if (serverTask.updatedAt !== localTask.updatedAt) return true;
    }
    
    return false;
  }

  /**
   * Resolve conflicts based on selected strategy
   */
  private async resolveConflict(local: StorageData, server: StorageData): Promise<StorageData> {
    switch (this.conflictResolution) {
      case ConflictResolution.LAST_WRITE_WINS:
        return this.lastWriteWins(local, server);
      
      case ConflictResolution.MERGE:
        return this.merge(local, server);
      
      case ConflictResolution.MANUAL:
        return await this.manualResolution(local, server);
      
      default:
        return local;
    }
  }

  /**
   * Last-write-wins: Use the most recently updated version of each task
   */
  private lastWriteWins(local: StorageData, server: StorageData): StorageData {
    const mergedTasks: Task[] = [];
    const allTaskIds = new Set([...local.tasks.map(t => t.id), ...server.tasks.map(t => t.id)]);

    for (const id of allTaskIds) {
      const localTask = local.tasks.find(t => t.id === id);
      const serverTask = server.tasks.find(t => t.id === id);

      if (!localTask) {
        mergedTasks.push(serverTask!);
      } else if (!serverTask) {
        mergedTasks.push(localTask);
      } else {
        // Use the most recently updated version
        const localTime = new Date(localTask.updatedAt).getTime();
        const serverTime = new Date(serverTask.updatedAt).getTime();
        mergedTasks.push(localTime > serverTime ? localTask : serverTask);
      }
    }

    return { version: 2, tasks: mergedTasks };
  }

  /**
   * Merge: Combine changes from both sources
   * Keeps all unique tasks, merges fields for conflicts
   */
  private merge(local: StorageData, server: StorageData): StorageData {
    const mergedTasks: Task[] = [];
    const allTaskIds = new Set([...local.tasks.map(t => t.id), ...server.tasks.map(t => t.id)]);

    for (const id of allTaskIds) {
      const localTask = local.tasks.find(t => t.id === id);
      const serverTask = server.tasks.find(t => t.id === id);

      if (!localTask) {
        mergedTasks.push(serverTask!);
      } else if (!serverTask) {
        mergedTasks.push(localTask);
      } else {
        // Merge fields: prefer non-null values from the more recent update
        const localTime = new Date(localTask.updatedAt).getTime();
        const serverTime = new Date(serverTask.updatedAt).getTime();
        const isLocalNewer = localTime > serverTime;

        mergedTasks.push({
          ...serverTask,
          ...(isLocalNewer ? localTask : {}),
          // Always merge tags (union of both)
          tags: [...new Set([...localTask.tags, ...serverTask.tags])],
          updatedAt: isLocalNewer ? localTask.updatedAt : serverTask.updatedAt,
        });
      }
    }

    return { version: 2, tasks: mergedTasks };
  }

  /**
   * Manual resolution: Prompt user to resolve conflicts
   * In a real app, this would show a UI for conflict resolution
   */
  private async manualResolution(local: StorageData, server: StorageData): Promise<StorageData> {
    // For demo purposes, default to last-write-wins
    // In production, this would:
    // 1. Show a modal listing conflicts
    // 2. Let user choose which version to keep for each conflict
    // 3. Return the resolved data
    console.warn('Manual conflict resolution not implemented, using last-write-wins');
    return this.lastWriteWins(local, server);
  }

  /**
   * Sync with server (pull latest changes)
   */
  async sync(): Promise<StorageData> {
    return await this.load();
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Set conflict resolution strategy
   */
  setConflictResolution(strategy: ConflictResolution): void {
    this.conflictResolution = strategy;
  }
}

/**
 * Mock API Adapter for testing
 * Simulates API calls with delays and potential conflicts
 */
export class MockApiStorageAdapter extends ApiStorageAdapter {
  private mockData: StorageData = { version: 2, tasks: [] };
  private delay: number = 100;

  constructor(delay: number = 100) {
    super('/mock/api');
    this.delay = delay;
  }

  async load(): Promise<StorageData> {
    await this.simulateDelay();
    return { ...this.mockData };
  }

  async save(data: StorageData): Promise<void> {
    await this.simulateDelay();
    this.mockData = { ...data };
  }

  async clear(): Promise<void> {
    await this.simulateDelay();
    this.mockData = { version: 2, tasks: [] };
  }

  private simulateDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }

  /**
   * Simulate a conflict by modifying mock data
   */
  simulateConflict(): void {
    this.mockData.tasks = this.mockData.tasks.map(task => ({
      ...task,
      updatedAt: new Date().toISOString(),
    }));
  }
}
