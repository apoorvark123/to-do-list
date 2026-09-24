# TaskFlow - Modern To-Do List Web App

A production-ready, feature-rich task management application built with React, TypeScript, and Vite. Features persistent storage using localStorage with schema versioning, comprehensive filtering and sorting, and a beautiful responsive UI.

## Features

- ✅ **Full CRUD Operations**: Add, edit, delete, and toggle task completion
- 💾 **Persistent Storage**: Automatic localStorage persistence with debouncing and schema migration
- 🔍 **Advanced Filtering**: Filter by status, priority, tags, and search queries
- 📊 **Sorting Options**: Sort by creation date, due date, priority, or custom order
- 🏷️ **Tags Support**: Organize tasks with custom tags
- 📅 **Due Dates**: Set and track task due dates with overdue indicators
- 🔔 **Priority Levels**: High, medium, and low priority with visual indicators
- ↩️ **Undo Delete**: Restore accidentally deleted tasks within 30 seconds
- 📤 **Import/Export**: Backup and restore tasks as JSON
- ⌨️ **Keyboard Shortcuts**: Quick actions with keyboard shortcuts
- ♿ **Accessible**: Full ARIA support and keyboard navigation
- 📱 **Responsive**: Beautiful UI that works on all screen sizes
- 🧪 **Tested**: Unit tests with Vitest and React Testing Library

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint + Prettier

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd todo-app

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
todo-app/
├── src/
│   ├── components/          # React components
│   │   ├── TaskItem.tsx    # Individual task display
│   │   ├── TaskList.tsx    # Task list container
│   │   ├── TaskEditor.tsx  # Task creation/edit modal
│   │   ├── TaskFilters.tsx # Filter and search controls
│   │   └── Toast.tsx       # Notification toast
│   ├── context/            # React Context
│   │   └── TaskContext.tsx # Global state management
│   ├── storage/            # Storage layer
│   │   └── storageAdapter.ts # localStorage with versioning
│   ├── types/              # TypeScript types
│   │   └── task.ts         # Task model and interfaces
│   ├── test/               # Test configuration
│   │   └── setup.ts
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── README.md               # This file
```

## Data Model

### Task Schema

```typescript
interface Task {
  id: string;              // UUID
  title: string;           // Required, max 200 chars
  notes?: string;          // Optional, max 1000 chars
  dueDate?: string;        // ISO 8601 date string
  priority: Priority;      // 'low' | 'medium' | 'high'
  tags: string[];          // Array of tags, max 10
  status: TaskStatus;      // 'active' | 'completed'
  createdAt: string;       // ISO 8601 timestamp
  updatedAt: string;       // ISO 8601 timestamp
  order: number;           // For drag-and-drop ordering
}
```

### Storage Schema

```typescript
interface StorageData {
  version: number;          // Current schema version (2)
  tasks: Task[];           // Array of tasks
  lastSyncedAt?: string;   // Last sync timestamp (for API sync)
}
```

## localStorage Strategy

### Storage Key
- Key: `taskflow_tasks`
- Version: 2

### Write Strategy
- **Debounced**: Writes are debounced by 500ms to avoid excessive localStorage operations
- **Batched**: Multiple rapid changes result in a single write
- **Force Save**: Available for critical operations (e.g., before page unload)

### Migration Strategy
- Schema version is stored with the data
- On load, version is checked and migration runs if needed
- Example: v1 → v2 migration adds priority, tags, and status fields

### Storage Limits
- Monitored for quota exceeded errors (typically 5-10MB)
- Automatic cleanup removes oldest completed tasks when quota is exceeded

### Example Persisted JSON

```json
{
  "version": 2,
  "tasks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Complete project documentation",
      "notes": "Write comprehensive README and API docs",
      "dueDate": "2024-12-31",
      "priority": "high",
      "tags": ["work", "documentation"],
      "status": "active",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "order": 0
    }
  ]
}
```

## Usage

### Adding a Task

1. Click the "Add New Task" button or press `Ctrl/Cmd + N`
2. Fill in the task details:
   - **Title** (required): Task name
   - **Notes** (optional): Additional details
   - **Due Date** (optional): When the task is due
   - **Priority**: low, medium, or high
   - **Tags**: Add custom tags (press Enter to add)
3. Click "Save" or press Enter

### Editing a Task

1. Hover over the task to reveal action buttons
2. Click the edit (pencil) icon
3. Modify the task details
4. Click "Save"

### Deleting a Task

1. Hover over the task to reveal action buttons
2. Click the delete (trash) icon
3. Click "Undo Delete" within 30 seconds to restore

### Filtering and Sorting

- **Search**: Type in the search box to filter by title, notes, or tags
- **Status Filter**: Show all, active, or completed tasks
- **Priority Filter**: Show all, high, medium, or low priority tasks
- **Sort By**: Order, creation date, due date, or priority
- **Sort Order**: Ascending or descending

### Keyboard Shortcuts

- `Ctrl/Cmd + N`: Create new task
- `Escape`: Close editor modal

### Import/Export

- **Export**: Click the download icon to export tasks as JSON
- **Import**: Click the upload icon to import tasks from a JSON file

## API Sync (Optional)

The app includes a storage adapter abstraction that allows switching between localStorage and a remote API. To implement API sync:

1. Create a new adapter implementing `IStorageAdapter`:

```typescript
import { IStorageAdapter, StorageData } from './storageAdapter';

export class ApiStorageAdapter implements IStorageAdapter {
  async load(): Promise<StorageData> {
    const response = await fetch('/api/tasks');
    return response.json();
  }

  async save(data: StorageData): Promise<void> {
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  }

  async clear(): Promise<void> {
    await fetch('/api/tasks', { method: 'DELETE' });
  }
}
```

2. Replace the adapter in `TaskContext.tsx`:

```typescript
import { ApiStorageAdapter } from './apiStorageAdapter';

const apiAdapter = new ApiStorageAdapter();
// Use apiAdapter instead of storageAdapter
```

3. Implement conflict resolution strategies:
   - **Last-write-wins**: Most recent change wins
   - **Merge**: Combine changes from both sources
   - **Manual**: Prompt user to resolve conflicts

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm test -- --coverage
```

## Linting and Formatting

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

## Accessibility

- Full keyboard navigation support
- ARIA labels and roles for screen readers
- Focus management for modals
- High contrast color ratios
- Semantic HTML structure

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Debounced localStorage writes (500ms)
- Optimized re-renders with React.memo and useCallback
- Efficient filtering and sorting with useMemo
- Lazy loading of components (can be extended)

## Security Considerations

- Input validation on all user inputs
- XSS prevention through React's built-in escaping
- No sensitive data stored in localStorage
- Content Security Policy recommended for production

## Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Build
npm run build

# Deploy dist/ folder to Netlify
```

### GitHub Actions

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Acceptance Criteria

1. ✅ Add a task and reload the app → task persists
2. ✅ Edit a task and reload the app → changes persist
3. ✅ Delete a task and click undo → task is restored
4. ✅ Mark task as complete → visual feedback shows completion
5. ✅ Filter by status → only matching tasks display
6. ✅ Search for a task → matching tasks appear
7. ✅ Export tasks → JSON file downloads
8. ✅ Import tasks → tasks load successfully
9. ✅ Set due date in past → overdue indicator shows
10. ✅ Add tags to task → tags display on task card

## Future Enhancements

- 🔄 **Real-time Sync**: WebSocket-based multi-device sync
- 🔔 **Notifications**: Browser notifications for due tasks
- 📅 **Calendar View**: Monthly calendar view of tasks
- 🔄 **Recurring Tasks**: Daily, weekly, monthly recurrence
- 🔗 **External Integrations**: Sync with Todoist, Google Tasks
- 📊 **Analytics**: Task completion statistics and charts
- 👥 **Collaboration**: Share task lists with others
- 🎨 **Themes**: Dark mode and custom themes
- 📱 **PWA**: Progressive Web App support
- 🔊 **Voice Commands**: Add tasks via voice input

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

For issues and questions, please open an issue on GitHub.
