import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Task, CreateTaskInput, UpdateTaskInput, FilterOptions, ValidationError, Priority, TaskStatus } from '../types/task';
import { storageAdapter } from '../storage/storageAdapter';

/**
 * Task context interface
 */
interface TaskContextType {
  tasks: Task[];
  filteredTasks: Task[];
  filterOptions: FilterOptions;
  isLoading: boolean;
  error: string | null;
  addTask: (input: CreateTaskInput) => Promise<Task | ValidationError[]>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task | ValidationError[]>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string) => Promise<void>;
  reorderTasks: (fromIndex: number, toIndex: number) => Promise<void>;
  setFilterOptions: (options: FilterOptions) => void;
  undoDelete: () => Promise<void>;
  exportTasks: () => string;
  exportTasksAsText: () => string;
  importTasks: (json: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

/**
 * Task provider props
 */
interface TaskProviderProps {
  children: React.ReactNode;
}

/**
 * Task Provider
 * Manages task state and persistence
 */
export function TaskProvider({ children }: TaskProviderProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: 'all',
    priority: 'all',
    searchQuery: '',
    sortBy: 'order',
    sortOrder: 'asc',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletedTask, setDeletedTask] = useState<Task | null>(null);

  /**
   * Load tasks from storage on mount
   */
  useEffect(() => {
    loadTasks();
  }, []);

  /**
   * Load tasks from storage
   */
  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const data = await storageAdapter.load();
      setTasks(data.tasks);
      setError(null);
    } catch (err) {
      setError('Failed to load tasks');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save tasks to storage
   */
  const saveTasks = useCallback(async (updatedTasks: Task[]) => {
    try {
      await storageAdapter.save({ tasks: updatedTasks, version: 2 });
    } catch (err) {
      setError('Failed to save tasks');
      console.error(err);
    }
  }, []);

  /**
   * Validate task input
   */
  const validateTask = (input: CreateTaskInput | UpdateTaskInput): ValidationError[] => {
    const errors: ValidationError[] = [];

    if ('title' in input && input.title !== undefined) {
      if (!input.title || input.title.trim().length === 0) {
        errors.push({ field: 'title', message: 'Title is required' });
      }
      if (input.title.length > 200) {
        errors.push({ field: 'title', message: 'Title must be less than 200 characters' });
      }
    }

    if ('notes' in input && input.notes && input.notes.length > 1000) {
      errors.push({ field: 'notes', message: 'Notes must be less than 1000 characters' });
    }

    if ('tags' in input && input.tags) {
      if (input.tags.length > 10) {
        errors.push({ field: 'tags', message: 'Maximum 10 tags allowed' });
      }
      input.tags.forEach((tag, index) => {
        if (tag.length > 30) {
          errors.push({ field: `tags[${index}]`, message: 'Tag must be less than 30 characters' });
        }
      });
    }

    return errors;
  };

  /**
   * Add a new task
   */
  const addTask = useCallback(async (input: CreateTaskInput): Promise<Task | ValidationError[]> => {
    const errors = validateTask(input);
    if (errors.length > 0) {
      return errors;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      notes: input.notes?.trim(),
      dueDate: input.dueDate,
      priority: input.priority || Priority.MEDIUM,
      tags: input.tags || [],
      status: TaskStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      order: tasks.length,
    };

    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);

    return newTask;
  }, [tasks, saveTasks]);

  /**
   * Update an existing task
   */
  const updateTask = useCallback(async (id: string, input: UpdateTaskInput): Promise<Task | ValidationError[]> => {
    const errors = validateTask(input);
    if (errors.length > 0) {
      return errors;
    }

    const taskIndex = tasks.findIndex((t: Task) => t.id === id);
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    const updatedTask: Task = {
      ...tasks[taskIndex],
      ...input,
      title: input.title !== undefined ? input.title.trim() : tasks[taskIndex].title,
      notes: input.notes !== undefined ? input.notes.trim() : tasks[taskIndex].notes,
      updatedAt: new Date().toISOString(),
    };

    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = updatedTask;
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);

    return updatedTask;
  }, [tasks, saveTasks]);

  /**
   * Delete a task (with undo support)
   */
  const deleteTask = useCallback(async (id: string) => {
    const task = tasks.find((t: Task) => t.id === id);
    if (!task) return;

    setDeletedTask(task);
    const updatedTasks = tasks.filter((t: Task) => t.id !== id);
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);

    // Clear deleted task after 30 seconds (undo window)
    setTimeout(() => {
      setDeletedTask(null);
    }, 30000);
  }, [tasks, saveTasks]);

  /**
   * Undo last delete
   */
  const undoDelete = useCallback(async () => {
    if (!deletedTask) return;

    const updatedTasks = [...tasks, deletedTask];
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
    setDeletedTask(null);
  }, [deletedTask, tasks, saveTasks]);

  /**
   * Toggle task completion status
   */
  const toggleTaskStatus = useCallback(async (id: string) => {
    const task = tasks.find((t: Task) => t.id === id);
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      status: task.status === TaskStatus.ACTIVE ? TaskStatus.COMPLETED : TaskStatus.ACTIVE,
      updatedAt: new Date().toISOString(),
    };

    const updatedTasks = tasks.map((t: Task) => (t.id === id ? updatedTask : t));
    setTasks(updatedTasks);
    await saveTasks(updatedTasks);
  }, [tasks, saveTasks]);

  /**
   * Reorder tasks (drag and drop)
   */
  const reorderTasks = useCallback(async (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const updatedTasks = [...tasks];
    const [removed] = updatedTasks.splice(fromIndex, 1);
    updatedTasks.splice(toIndex, 0, removed);

    // Update order values
    const reorderedTasks = updatedTasks.map((task: Task, index: number) => ({
      ...task,
      order: index,
    }));

    setTasks(reorderedTasks);
    await saveTasks(reorderedTasks);
  }, [tasks, saveTasks]);

  /**
   * Filter and sort tasks
   */
  const filteredTasks = React.useMemo(() => {
    let result = [...tasks];

    // Filter by status
    if (filterOptions.status && filterOptions.status !== 'all') {
      result = result.filter((t: Task) => t.status === filterOptions.status);
    }

    // Filter by priority
    if (filterOptions.priority && filterOptions.priority !== 'all') {
      result = result.filter((t: Task) => t.priority === filterOptions.priority);
    }

    // Filter by tag
    if (filterOptions.tag) {
      result = result.filter((t: Task) => t.tags.includes(filterOptions.tag!));
    }

    // Search query
    if (filterOptions.searchQuery) {
      const query = filterOptions.searchQuery.toLowerCase();
      result = result.filter(
        (t: Task) =>
          t.title.toLowerCase().includes(query) ||
          t.notes?.toLowerCase().includes(query) ||
          t.tags.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    if (filterOptions.sortBy) {
      result.sort((a, b) => {
        let comparison = 0;

        switch (filterOptions.sortBy) {
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'dueDate':
            if (!a.dueDate && !b.dueDate) comparison = 0;
            else if (!a.dueDate) comparison = 1;
            else if (!b.dueDate) comparison = -1;
            else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            break;
          case 'priority':
            const priorityOrder: Record<string, number> = { low: 0, medium: 1, high: 2 };
            comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
            break;
          case 'order':
            comparison = a.order - b.order;
            break;
        }

        return filterOptions.sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  }, [tasks, filterOptions]);

  /**
   * Export tasks as JSON with metadata for sharing
   */
  const exportTasks = useCallback(() => {
    const exportData = {
      metadata: {
        appName: 'TaskFlow',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        exportedBy: 'User',
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        activeTasks: tasks.filter(t => t.status === 'active').length,
      },
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        notes: task.notes || '',
        dueDate: task.dueDate || 'Not set',
        priority: task.priority,
        tags: task.tags.length > 0 ? task.tags : [],
        status: task.status,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      })),
      schemaVersion: 2,
    };

    return JSON.stringify(exportData, null, 2);
  }, [tasks]);

  /**
   * Export tasks as readable text format
   */
  const exportTasksAsText = useCallback(() => {
    let text = `TaskFlow - Task List\n`;
    text += `Exported on: ${new Date().toLocaleString()}\n`;
    text += `${'='.repeat(50)}\n\n`;
    text += `Total Tasks: ${tasks.length}\n`;
    text += `Completed: ${tasks.filter(t => t.status === 'completed').length}\n`;
    text += `Active: ${tasks.filter(t => t.status === 'active').length}\n\n`;
    text += `${'='.repeat(50)}\n\n`;

    if (tasks.length === 0) {
      text += 'No tasks to display.\n';
      return text;
    }

    // Group by status
    const activeTasks = tasks.filter(t => t.status === 'active');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    if (activeTasks.length > 0) {
      text += `📋 ACTIVE TASKS (${activeTasks.length})\n`;
      text += `${'-'.repeat(50)}\n`;
      activeTasks.forEach((task, index) => {
        text += `${index + 1}. ${task.title}\n`;
        if (task.notes) text += `   Notes: ${task.notes}\n`;
        if (task.dueDate) text += `   Due: ${task.dueDate}\n`;
        text += `   Priority: ${task.priority.toUpperCase()}\n`;
        if (task.tags.length > 0) text += `   Tags: ${task.tags.join(', ')}\n`;
        text += `\n`;
      });
    }

    if (completedTasks.length > 0) {
      text += `\n✅ COMPLETED TASKS (${completedTasks.length})\n`;
      text += `${'-'.repeat(50)}\n`;
      completedTasks.forEach((task, index) => {
        text += `${index + 1}. ${task.title}\n`;
        if (task.notes) text += `   Notes: ${task.notes}\n`;
        if (task.dueDate) text += `   Due: ${task.dueDate}\n`;
        text += `   Priority: ${task.priority.toUpperCase()}\n`;
        if (task.tags.length > 0) text += `   Tags: ${task.tags.join(', ')}\n`;
        text += `\n`;
      });
    }

    return text;
  }, [tasks]);

  /**
   * Import tasks from JSON
   */
  const importTasks = useCallback(async (json: string) => {
    try {
      const data = JSON.parse(json);
      
      // Handle both old format (direct tasks array) and new format (with metadata)
      const tasksToImport = Array.isArray(data.tasks) ? data.tasks : data;
      
      if (!Array.isArray(tasksToImport)) {
        throw new Error('Invalid format');
      }

      // Convert tasks to proper format if needed
      const formattedTasks = tasksToImport.map((task: any) => ({
        id: task.id,
        title: task.title,
        notes: task.notes || '',
        dueDate: task.dueDate === 'Not set' ? undefined : task.dueDate,
        priority: task.priority || 'medium',
        tags: Array.isArray(task.tags) ? task.tags : [],
        status: task.status || 'active',
        createdAt: task.createdAt || new Date().toISOString(),
        updatedAt: task.updatedAt || new Date().toISOString(),
        order: task.order || 0,
      }));

      setTasks(formattedTasks);
      await saveTasks(formattedTasks);
    } catch (err) {
      setError('Failed to import tasks');
      throw err;
    }
  }, [saveTasks]);

  const value: TaskContextType = {
    tasks,
    filteredTasks,
    filterOptions,
    isLoading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    reorderTasks,
    setFilterOptions,
    undoDelete,
    exportTasks,
    exportTasksAsText,
    importTasks,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

/**
 * Hook to use task context
 */
export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
