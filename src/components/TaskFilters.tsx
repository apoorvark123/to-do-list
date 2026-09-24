import { FilterOptions, Priority, TaskStatus } from '../types/task';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

interface TaskFiltersProps {
  filterOptions: FilterOptions;
  onFilterChange: (options: FilterOptions) => void;
  taskCount: number;
}

export function TaskFilters({ filterOptions, onFilterChange, taskCount }: TaskFiltersProps) {
  return (
    <div className="glass-card rounded-xl shadow-lg border border-purple-200 p-4 space-y-4 animate-fade-in">
      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
        <input
          type="text"
          value={filterOptions.searchQuery || ''}
          onChange={e => onFilterChange({ ...filterOptions, searchQuery: e.target.value })}
          placeholder="Search tasks..."
          className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50"
          aria-label="Search tasks"
        />
      </div>

      <div className="flex flex-wrap gap-3">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-purple-400" />
          <select
            value={filterOptions.status || 'all'}
            onChange={e => onFilterChange({ ...filterOptions, status: e.target.value as any })}
            className="px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white/50"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value={TaskStatus.ACTIVE}>Active</option>
            <option value={TaskStatus.COMPLETED}>Completed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <select
          value={filterOptions.priority || 'all'}
          onChange={e => onFilterChange({ ...filterOptions, priority: e.target.value as any })}
          className="px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white/50"
          aria-label="Filter by priority"
        >
          <option value="all">All Priorities</option>
          <option value={Priority.HIGH}>High</option>
          <option value={Priority.MEDIUM}>Medium</option>
          <option value={Priority.LOW}>Low</option>
        </select>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown size={18} className="text-purple-400" />
          <select
            value={filterOptions.sortBy || 'order'}
            onChange={e => onFilterChange({ ...filterOptions, sortBy: e.target.value as any })}
            className="px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white/50"
            aria-label="Sort tasks"
          >
            <option value="order">Order</option>
            <option value="createdAt">Created</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>

        {/* Sort Order */}
        <select
          value={filterOptions.sortOrder || 'asc'}
          onChange={e => onFilterChange({ ...filterOptions, sortOrder: e.target.value as any })}
          className="px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm bg-white/50"
          aria-label="Sort order"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {/* Task Count */}
      <p className="text-sm text-gray-600 font-medium">
        Showing <span className="text-purple-600 font-semibold">{taskCount}</span> {taskCount === 1 ? 'task' : 'tasks'}
      </p>
    </div>
  );
}
