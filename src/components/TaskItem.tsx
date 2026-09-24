import React, { useState } from 'react';
import { Task, Priority } from '../types/task';
import { format } from 'date-fns';
import { Check, Trash2, Edit2, Calendar, Tag as TagIcon, AlertCircle } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export function TaskItem({ task, onToggle, onDelete, onEdit }: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case Priority.HIGH:
        return 'priority-high text-white border-transparent';
      case Priority.MEDIUM:
        return 'priority-medium text-white border-transparent';
      case Priority.LOW:
        return 'priority-low text-white border-transparent';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <div
      className={`group glass-card rounded-xl shadow-md border-2 transition-all duration-300 hover:shadow-xl ${
        task.status === 'completed' ? 'border-purple-200 opacity-60' : 'border-purple-200 hover:border-purple-400'
      } ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="listitem"
      aria-label={`Task: ${task.title}, ${task.status === 'completed' ? 'completed' : 'active'}`}
    >
      <div className="p-4 flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            task.status === 'completed'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-500 text-white'
              : 'border-purple-300 hover:border-purple-500'
          }`}
          aria-label={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
          aria-checked={task.status === 'completed'}
        >
          {task.status === 'completed' && <Check size={14} />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`font-semibold text-gray-900 ${
                task.status === 'completed' ? 'line-through text-gray-500' : ''
              }`}
            >
              {task.title}
            </h3>
            {isOverdue && (
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" aria-label="Overdue" />
            )}
          </div>

          {task.notes && (
            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{task.notes}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Priority Badge */}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${getPriorityColor(
                task.priority
              )}`}
            >
              {task.priority}
            </span>

            {/* Due Date */}
            {task.dueDate && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Calendar size={12} className="text-purple-400" />
                {format(new Date(task.dueDate), 'MMM d, yyyy')}
              </span>
            )}

            {/* Tags */}
            {task.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <TagIcon size={12} className="text-purple-400" />
                {task.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-medium">
                    {tag}
                  </span>
                ))}
                {task.tags.length > 3 && (
                  <span className="text-xs text-gray-400">+{task.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div
          className={`flex items-center gap-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'} ${
            task.status === 'completed' ? 'opacity-100' : ''
          }`}
        >
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 rounded-md text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
            aria-label="Edit task"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            aria-label="Delete task"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
