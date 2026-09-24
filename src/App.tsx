import React, { useState, useCallback } from 'react';
import { TaskProvider, useTasks } from './context/TaskContext';
import { TaskList } from './components/TaskList';
import { TaskEditor } from './components/TaskEditor';
import { TaskFilters } from './components/TaskFilters';
import { Toast } from './components/Toast';
import { Plus, Download, Upload, RotateCcw } from 'lucide-react';
import { Task, CreateTaskInput } from './types/task';

function AppContent() {
  const {
    filteredTasks,
    filterOptions,
    setFilterOptions,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    undoDelete,
    exportTasks,
    exportTasksAsText,
    importTasks,
  } = useTasks();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const handleAddTask = useCallback(async () => {
    setIsEditorOpen(true);
    setEditingTask(undefined);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsEditorOpen(true);
  }, []);

  const handleSaveTask = useCallback(
    async (input: CreateTaskInput) => {
      if (editingTask) {
        const result = await updateTask(editingTask.id, input);
        if (!Array.isArray(result)) {
          setIsEditorOpen(false);
          setEditingTask(undefined);
          setToast({ message: 'Task updated successfully', type: 'success' });
        }
      } else {
        const result = await addTask(input);
        if (!Array.isArray(result)) {
          setIsEditorOpen(false);
          setToast({ message: 'Task created successfully', type: 'success' });
        }
      }
    },
    [addTask, updateTask, editingTask]
  );

  const handleDeleteTask = useCallback(
    async (id: string) => {
      await deleteTask(id);
      setToast({ message: 'Task deleted', type: 'info' });
    },
    [deleteTask]
  );

  const handleUndoDelete = useCallback(async () => {
    await undoDelete();
    setToast({ message: 'Task restored', type: 'success' });
  }, [undoDelete]);

  const handleExport = useCallback(() => {
    const json = exportTasks();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    a.download = `TaskFlow-Tasks-${date}-${time}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: 'Tasks exported as JSON', type: 'success' });
  }, [exportTasks]);

  const handleExportAsText = useCallback(() => {
    const text = exportTasksAsText();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    a.download = `TaskFlow-Tasks-${date}-${time}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: 'Tasks exported as text', type: 'success' });
  }, [exportTasksAsText]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        try {
          await importTasks(text);
          setToast({ message: 'Tasks imported successfully', type: 'success' });
        } catch {
          setToast({ message: 'Failed to import tasks', type: 'error' });
        }
      }
    };
    input.click();
  }, [importTasks]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N for new task
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleAddTask();
      }
      // Escape to close editor
      if (e.key === 'Escape' && isEditorOpen) {
        setIsEditorOpen(false);
        setEditingTask(undefined);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditorOpen, handleAddTask]);

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-extrabold gradient-text mb-2">TaskFlow</h1>
              <p className="text-gray-600 text-lg">Organize your tasks efficiently</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="p-3 rounded-xl glass-card hover:shadow-xl transition-all duration-300 hover:scale-105"
                aria-label="Export as JSON"
                title="Export as JSON"
              >
                <Download size={20} className="text-purple-600" />
              </button>
              <button
                onClick={handleExportAsText}
                className="p-3 rounded-xl glass-card hover:shadow-xl transition-all duration-300 hover:scale-105"
                aria-label="Export as text"
                title="Export as text"
              >
                <Download size={20} className="text-pink-600" />
              </button>
              <button
                onClick={handleImport}
                className="p-3 rounded-xl glass-card hover:shadow-xl transition-all duration-300 hover:scale-105"
                aria-label="Import tasks"
                title="Import tasks"
              >
                <Upload size={20} className="text-purple-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Add Task Button */}
        <button
          onClick={handleAddTask}
          className="w-full mb-6 px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center gap-2 font-semibold text-lg animate-scale-in"
          aria-label="Create new task (Ctrl/Cmd + N)"
        >
          <Plus size={24} />
          Add New Task
        </button>

        {/* Filters */}
        <TaskFilters
          filterOptions={filterOptions}
          onFilterChange={setFilterOptions}
          taskCount={filteredTasks.length}
        />

        {/* Task List */}
        <div className="mt-6">
          <TaskList
            tasks={filteredTasks}
            onToggle={toggleTaskStatus}
            onDelete={handleDeleteTask}
            onEdit={handleEditTask}
          />
        </div>

        {/* Undo Toast */}
        <div className="fixed bottom-4 left-4 animate-scale-in">
          <button
            onClick={handleUndoDelete}
            className="flex items-center gap-2 px-4 py-3 glass-card rounded-xl shadow-xl border border-purple-200 hover:shadow-2xl transition-all duration-300 hover:scale-105"
            aria-label="Undo last delete"
          >
            <RotateCcw size={18} className="text-purple-600" />
            <span className="text-sm font-semibold text-gray-700">Undo Delete</span>
          </button>
        </div>

        {/* Task Editor Modal */}
        {isEditorOpen && (
          <TaskEditor task={editingTask} onSave={handleSaveTask} onCancel={() => setIsEditorOpen(false)} />
        )}

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            duration={3000}
          />
        )}

        {/* Keyboard Shortcuts Help */}
        <div className="mt-8 p-4 glass-card rounded-xl shadow-lg border border-purple-200 animate-fade-in">
          <h3 className="font-semibold text-gray-900 mb-2">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>
              <kbd className="px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded text-xs font-medium">Ctrl/Cmd + N</kbd> New task
            </div>
            <div>
              <kbd className="px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 rounded text-xs font-medium">Escape</kbd> Close editor
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  );
}

export default App;
