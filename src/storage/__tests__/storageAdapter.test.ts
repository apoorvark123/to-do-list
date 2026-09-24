import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LocalStorageAdapter, storageAdapter } from '../storageAdapter';
import { Task, Priority, TaskStatus } from '../../types/task';

describe('LocalStorageAdapter', () => {
  const adapter = new LocalStorageAdapter();
  const mockTasks: Task[] = [
    {
      id: '1',
      title: 'Test Task 1',
      priority: Priority.HIGH,
      tags: [],
      status: TaskStatus.ACTIVE,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      order: 0,
    },
    {
      id: '2',
      title: 'Test Task 2',
      priority: Priority.LOW,
      tags: ['work'],
      status: TaskStatus.COMPLETED,
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      order: 1,
    },
  ];

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('loads empty storage when no data exists', async () => {
    const data = await adapter.load();
    expect(data.tasks).toEqual([]);
    expect(data.version).toBe(2);
  });

  it('saves and loads tasks correctly', async () => {
    await adapter.save({ version: 2, tasks: mockTasks });
    const data = await adapter.load();

    expect(data.tasks).toHaveLength(2);
    expect(data.tasks[0].title).toBe('Test Task 1');
  });

  it('clears storage correctly', async () => {
    await adapter.save({ version: 2, tasks: mockTasks });
    await adapter.clear();

    const data = await adapter.load();
    expect(data.tasks).toEqual([]);
  });

  it('migrates v1 to v2 data', async () => {
    const v1Data = {
      version: 1,
      tasks: [
        {
          id: '1',
          title: 'Old Task',
          completed: true,
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
    };

    localStorage.setItem('taskflow_tasks', JSON.stringify(v1Data));
    const data = await adapter.load();

    expect(data.version).toBe(2);
    expect(data.tasks[0].status).toBe(TaskStatus.COMPLETED);
    expect(data.tasks[0].priority).toBe(Priority.MEDIUM);
    expect(data.tasks[0].tags).toEqual([]);
  });
});
