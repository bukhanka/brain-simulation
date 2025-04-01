// Storage keys used in the application
export const STORAGE_KEYS = {
  EVENTS: "brain_simulator_events",
  MESSAGES: "brain_simulator_messages",
  TASKS: "brain_simulator_tasks",
  CURRENT_TASK: "brain_simulator_current_task",
  LOGS: "brain_simulator_logs",
  CONTEXT: "brain_simulator_context"
};

// Custom event name for localStorage updates within the same tab
export const STORAGE_UPDATE_EVENT = 'brain_simulator_storage_update';

// Track last dispatched values to prevent duplicate events
const lastDispatchedValues: Record<string, string> = {};
let dispatchTimeout: ReturnType<typeof setTimeout> | null = null;

// Dispatch a custom event to notify components of localStorage changes
export function dispatchStorageUpdate(key: string, data: any): void {
  if (typeof window === 'undefined') return;
  
  // Serialize the data to compare with previous values
  const newValue = JSON.stringify(data);
  
  // Skip if the exact same update was just dispatched
  if (lastDispatchedValues[key] === newValue) {
    return;
  }
  
  // Store the new value
  lastDispatchedValues[key] = newValue;
  
  // Debounce the event dispatch to prevent rapid-fire events
  if (dispatchTimeout) {
    clearTimeout(dispatchTimeout);
  }
  
  dispatchTimeout = setTimeout(() => {
    // Create a custom event that mimics the StorageEvent interface
    const event = new CustomEvent(STORAGE_UPDATE_EVENT, {
      detail: {
        key,
        newValue,
        oldValue: localStorage.getItem(key),
        storageArea: localStorage,
        url: window.location.href
      }
    });
    
    // Dispatch the event
    window.dispatchEvent(event);
    dispatchTimeout = null;
  }, 50); // 50ms debounce
}

// Store data with event dispatch
export function storeDataWithEvent(key: string, data: any): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Store in localStorage
    localStorage.setItem(key, JSON.stringify(data));
    
    // Notify components
    dispatchStorageUpdate(key, data);
  } catch (e) {
    console.error(`Error storing data for key ${key}:`, e);
  }
}

// Type for the complete brain simulator data
export type BrainSimulatorData = {
  events: Array<{ time: string; text: string }>;
  messages: any[]; // Using any as message structure is complex
  tasks: any[]; // Using any as task structure is complex
  currentTask: any | null;
  logs: Array<{ timestamp: Date; action: string; details: Record<string, any> }>;
  context: string[];
};

// Get all data from localStorage
export function getAllStoredData(): BrainSimulatorData {
  if (typeof window === 'undefined') {
    return {
      events: [],
      messages: [],
      tasks: [],
      currentTask: null,
      logs: [],
      context: []
    };
  }

  // Parse events with error handling
  let events = [];
  try {
    const savedEvents = localStorage.getItem(STORAGE_KEYS.EVENTS);
    events = savedEvents ? JSON.parse(savedEvents) : [];
  } catch (e) {
    console.error('Error loading events from localStorage:', e);
  }

  // Parse messages with error handling
  let messages = [];
  try {
    const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (savedMessages) {
      messages = JSON.parse(savedMessages, (key, value) => {
        if (key === 'timestamp') return new Date(value);
        return value;
      });
    }
  } catch (e) {
    console.error('Error loading messages from localStorage:', e);
  }

  // Parse tasks with error handling
  let tasks = [];
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (savedTasks) {
      tasks = JSON.parse(savedTasks, (key, value) => {
        if (key === 'createdAt') return new Date(value);
        return value;
      });
    }
  } catch (e) {
    console.error('Error loading tasks from localStorage:', e);
  }

  // Parse current task with error handling
  let currentTask = null;
  try {
    const savedTask = localStorage.getItem(STORAGE_KEYS.CURRENT_TASK);
    if (savedTask && savedTask !== "null") {
      currentTask = JSON.parse(savedTask, (key, value) => {
        if (key === 'createdAt') return new Date(value);
        return value;
      });
    }
  } catch (e) {
    console.error('Error loading current task from localStorage:', e);
  }

  // Parse logs with error handling
  let logs = [];
  try {
    const savedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
    if (savedLogs) {
      logs = JSON.parse(savedLogs, (key, value) => {
        if (key === 'timestamp') return new Date(value);
        return value;
      });
    }
  } catch (e) {
    console.error('Error loading logs from localStorage:', e);
  }

  // Parse context with error handling
  let context = [];
  try {
    const savedContext = localStorage.getItem(STORAGE_KEYS.CONTEXT);
    context = savedContext ? JSON.parse(savedContext) : [];
  } catch (e) {
    console.error('Error loading context from localStorage:', e);
  }

  return {
    events,
    messages,
    tasks,
    currentTask,
    logs,
    context
  };
}

// Store data in localStorage
export function storeAllData(data: BrainSimulatorData): void {
  if (typeof window === 'undefined') return;

  try {
    // Store events
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(data.events));
    
    // Store messages
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(data.messages));
    
    // Store tasks
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(data.tasks));
    
    // Store current task
    localStorage.setItem(STORAGE_KEYS.CURRENT_TASK, JSON.stringify(data.currentTask));
    
    // Store logs
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data.logs));
    
    // Store context
    localStorage.setItem(STORAGE_KEYS.CONTEXT, JSON.stringify(data.context));
  } catch (e) {
    console.error('Error storing data in localStorage:', e);
  }
}

// Export data as JSON file
export function exportDataAsFile(): void {
  if (typeof window === 'undefined') return;

  try {
    const data = getAllStoredData();
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `brain-simulator-backup-${date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Error exporting data:', e);
  }
}

// Import data from JSON file
export function importDataFromJson(jsonData: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const data = JSON.parse(jsonData, (key, value) => {
      if (key === 'timestamp' || key === 'createdAt') {
        return new Date(value);
      }
      return value;
    }) as BrainSimulatorData;
    
    // Validate the imported data has the expected structure
    if (!data.events || !data.messages || !data.tasks || !Array.isArray(data.logs)) {
      throw new Error('Invalid data structure in imported file');
    }
    
    // Store the imported data
    storeAllData(data);
    return true;
  } catch (e) {
    console.error('Error importing data:', e);
    return false;
  }
}

// Clear all stored data
export function clearAllData(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_TASK);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
    localStorage.removeItem(STORAGE_KEYS.CONTEXT);
  } catch (e) {
    console.error('Error clearing data from localStorage:', e);
  }
} 