import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskItem } from '../TaskItem';
import { Task, Priority, TaskStatus } from '../../types/task';

describe('TaskItem', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    notes: 'Test notes',
    dueDate: '2024-12-31',
    priority: Priority.HIGH,
    tags: ['work', 'urgent'],
    status: TaskStatus.ACTIVE,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    order: 0,
  };

  const mockOnToggle = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnEdit = vi.fn();

  it('renders task correctly', () => {
    render(<TaskItem task={mockTask} onToggle={mockOnToggle} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test notes')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('calls onToggle when checkbox is clicked', () => {
    render(<TaskItem task={mockTask} onToggle={mockOnToggle} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

    const checkbox = screen.getByRole('button', { name: /mark as complete/i });
    fireEvent.click(checkbox);

    expect(mockOnToggle).toHaveBeenCalledWith('1');
  });

  it('calls onDelete when delete button is clicked', () => {
    render(<TaskItem task={mockTask} onToggle={mockOnToggle} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

    const deleteButton = screen.getByLabelText('Delete task');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('calls onEdit when edit button is clicked', () => {
    render(<TaskItem task={mockTask} onToggle={mockOnToggle} onDelete={mockOnDelete} onEdit={mockOnEdit} />);

    const editButton = screen.getByLabelText('Edit task');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  it('shows completed task with strikethrough', () => {
    const completedTask = { ...mockTask, status: TaskStatus.COMPLETED };
    render(
      <TaskItem task={completedTask} onToggle={mockOnToggle} onDelete={mockOnDelete} onEdit={mockOnEdit} />
    );

    const title = screen.getByText('Test Task');
    expect(title).toHaveClass('line-through');
  });
});
