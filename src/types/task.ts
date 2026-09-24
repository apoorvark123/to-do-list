/**
 * Task priority levels
 */
export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

/**
 * Task status
 */
export enum TaskStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

/**
 * Task data model
 * Represents a single task in the to-do list
 */
export interface Task {
  id: string;
  title: string;
  notes?: string;
  dueDate?: string; // ISO 8601 date string
  priority: Priority;
  tags: string[];
  status: TaskStatus;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  order: number; // For drag-and-drop ordering
}

/**
 * Storage schema version
 */
export const STORAGE_VERSION = 2;

/**
 * Storage data structure
 */
export interface StorageData {
  version: number;
  tasks: Task[];
  lastSyncedAt?: string;
}

/**
 * Filter options for task list
 */
export interface FilterOptions {
  status?: TaskStatus | 'all';
  priority?: Priority | 'all';
  searchQuery?: string;
  tag?: string;
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'order';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Task creation input
 */
export interface CreateTaskInput {
  title: string;
  notes?: string;
  dueDate?: string;
  priority?: Priority;
  tags?: string[];
}

/**
 * Task update input
 */
export interface UpdateTaskInput {
  title?: string;
  notes?: string;
  dueDate?: string;
  priority?: Priority;
  tags?: string[];
  status?: TaskStatus;
  order?: number;
}
