import { create } from 'zustand';
import { addDays, startOfDay, differenceInDays, startOfWeek, endOfWeek, min, max } from 'date-fns';
import { Language } from './i18n';

export type ViewMode = 'daily' | 'weekly';

export interface Group {
  id: string;
  name: string;
  color: string;
}

export interface ProjectState {
  clientName: string;
  projectName: string;
  projectVersion: string;
  tasks: Task[];
  groups: Group[];
  viewMode: ViewMode;
  zoomLevel: number;
  versions?: ProjectVersion[];
}

export interface ProjectVersion {
  id: string;
  name?: string; // legacy
  version?: string;
  description?: string;
  timestamp: number;
  data: ProjectState;
}

export interface Task {
  id: string;
  name: string;
  groupId: string;
  startDate: Date;
  endDate: Date;
  progress: number;
  isMilestone?: boolean;
}

export interface HistoryState {
  tasks: Task[];
  groups: Group[];
}

const calculateBounds = (tasks: Task[], viewMode: ViewMode) => {
  if (tasks.length === 0) {
    const today = startOfDay(new Date());
    if (viewMode === 'daily') {
      return {
        chartStartDate: addDays(today, -2),
        chartEndDate: addDays(today, 14)
      };
    } else {
      return {
        chartStartDate: startOfWeek(addDays(today, -7), { weekStartsOn: 1 }),
        chartEndDate: endOfWeek(addDays(today, 28), { weekStartsOn: 1 })
      };
    }
  }
  const minDate = min(tasks.map(t => t.startDate));
  const maxDate = max(tasks.map(t => t.endDate));
  
  let newStart: Date;
  let newEnd: Date;

  if (viewMode === 'daily') {
    newStart = addDays(minDate, -2);
    newEnd = addDays(maxDate, 2);
  } else {
    newStart = startOfWeek(addDays(minDate, -7), { weekStartsOn: 1 });
    newEnd = endOfWeek(addDays(maxDate, 7), { weekStartsOn: 1 });
  }
    
  return {
    chartStartDate: newStart,
    chartEndDate: newEnd
  };
};

interface AppState {
  clientName: string;
  projectName: string;
  projectVersion: string;
  setProjectInfo: (clientName: string, projectName: string, projectVersion: string) => void;

  tasks: Task[];
  groups: Group[];
  viewMode: ViewMode;
  zoomLevel: number;
  chartStartDate: Date;
  chartEndDate: Date;
  
  past: HistoryState[];
  future: HistoryState[];
  undo: () => void;
  redo: () => void;
  
  language: Language;
  setLanguage: (lang: Language) => void;
  
  showVerticalLines: boolean;
  setShowVerticalLines: (show: boolean) => void;
  
  showTodayHighlight: boolean;
  setShowTodayHighlight: (show: boolean) => void;
  
  dateFormat: string;
  setDateFormat: (format: string) => void;
  
  weekNumbering: 'project' | 'calendar';
  setWeekNumbering: (mode: 'project' | 'calendar') => void;
  
  isSettingsModalOpen: boolean;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  
  isProjectInfoModalOpen: boolean;
  openProjectInfoModal: () => void;
  closeProjectInfoModal: () => void;
  
  versions: ProjectVersion[];
  isVersionModalOpen: boolean;
  openVersionModal: () => void;
  closeVersionModal: () => void;
  saveVersion: (name: string) => void;
  restoreVersion: (id: string) => void;
  deleteVersion: (id: string) => void;
  importProject: (data: ProjectState) => void;
  
  isTaskModalOpen: boolean;
  editingTaskId: string | null;
  openTaskModal: (taskId?: string) => void;
  closeTaskModal: () => void;
  
  setTasks: (tasks: Task[]) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  updateTaskDates: (id: string, startDate: Date, endDate: Date) => void;
  commitTaskDates: (id: string, initialStartDate: Date, initialEndDate: Date, newStartDate: Date, newEndDate: Date) => void;
  addTask: (task: Omit<Task, 'id'>) => void;
  deleteTask: (id: string) => void;
  updateTaskName: (id: string, name: string) => void;
  reorderTasks: (activeId: string, overId: string) => void;
  
  addGroup: (group: Group) => void;
  updateGroup: (id: string, updates: Partial<Group>) => void;
  deleteGroup: (id: string) => void;
  updateGroupColor: (id: string, color: string) => void;
  
  setViewMode: (mode: ViewMode) => void;
  setZoomLevel: (level: number) => void;
  setChartDates: (start: Date, end: Date) => void;
  resetProject: () => void;

  rowHeights: Record<string, number>;
  setRowHeight: (id: string, height: number) => void;

  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
}

const initialGroups: Group[] = [
  { id: 'g1', name: 'Sample', color: '#f4a7b9' },
  { id: 'g2', name: 'Test', color: '#f8b500' },
  { id: 'g3', name: 'Certification', color: '#a8c97f' },
  { id: 'g4', name: 'Production', color: '#33a6b8' },
  { id: 'g5', name: 'Documentation', color: '#9b90c4' },
];

const today = startOfDay(new Date());

export const initialTasks: Task[] = [
  { id: 't1', name: 'Setup Project', groupId: 'g1', startDate: today, endDate: addDays(today, 3), progress: 100 },
  { id: 't2', name: 'Design UI', groupId: 'g2', startDate: addDays(today, 2), endDate: addDays(today, 6), progress: 60 },
  { id: 't3', name: 'Implement Backend', groupId: 'g4', startDate: addDays(today, 4), endDate: addDays(today, 10), progress: 20 },
  { id: 't4', name: 'Marketing Campaign', groupId: 'g5', startDate: addDays(today, 8), endDate: addDays(today, 14), progress: 0 },
];

const initialBounds = calculateBounds(initialTasks, 'weekly');

const pushHistory = (state: AppState): Pick<AppState, 'past' | 'future'> => {
  return {
    past: [...state.past, { tasks: state.tasks, groups: state.groups }],
    future: [],
  };
};

export const useStore = create<AppState>((set) => ({
  clientName: 'Client A',
  projectName: 'New Project',
  projectVersion: 'v0',
  setProjectInfo: (clientName, projectName, projectVersion) => set({ clientName, projectName, projectVersion }),

  tasks: initialTasks,
  groups: initialGroups,
  viewMode: 'weekly',
  zoomLevel: 100,
  chartStartDate: initialBounds.chartStartDate,
  chartEndDate: initialBounds.chartEndDate,

  past: [],
  future: [],
  rowHeights: {},
  sidebarWidth: 320,

  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth: Math.max(200, Math.min(600, sidebarWidth)) }),

  setRowHeight: (id, height) => set((state) => {
    if (state.rowHeights[id] === height) return state;
    return { rowHeights: { ...state.rowHeights, [id]: height } };
  }),

  undo: () => set((state) => {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, -1);
    const current: HistoryState = { tasks: state.tasks, groups: state.groups };
    const bounds = calculateBounds(previous.tasks, state.viewMode);
    return {
      past: newPast,
      future: [current, ...state.future],
      tasks: previous.tasks,
      groups: previous.groups,
      chartStartDate: bounds.chartStartDate,
      chartEndDate: bounds.chartEndDate,
    };
  }),

  redo: () => set((state) => {
    if (state.future.length === 0) return state;
    const next = state.future[0];
    const newFuture = state.future.slice(1);
    const current: HistoryState = { tasks: state.tasks, groups: state.groups };
    const bounds = calculateBounds(next.tasks, state.viewMode);
    return {
      past: [...state.past, current],
      future: newFuture,
      tasks: next.tasks,
      groups: next.groups,
      chartStartDate: bounds.chartStartDate,
      chartEndDate: bounds.chartEndDate,
    };
  }),

  language: 'en',
  setLanguage: (language) => set({ language }),

  showVerticalLines: false,
  setShowVerticalLines: (showVerticalLines) => set({ showVerticalLines }),

  showTodayHighlight: false,
  setShowTodayHighlight: (showTodayHighlight) => set({ showTodayHighlight }),

  dateFormat: 'd-MMM',
  setDateFormat: (dateFormat) => set({ dateFormat }),

  weekNumbering: 'project',
  setWeekNumbering: (weekNumbering) => set({ weekNumbering }),

  isSettingsModalOpen: false,
  openSettingsModal: () => set({ isSettingsModalOpen: true }),
  closeSettingsModal: () => set({ isSettingsModalOpen: false }),

  isProjectInfoModalOpen: false,
  openProjectInfoModal: () => set({ isProjectInfoModalOpen: true }),
  closeProjectInfoModal: () => set({ isProjectInfoModalOpen: false }),

  versions: [],
  isVersionModalOpen: false,
  openVersionModal: () => set({ isVersionModalOpen: true }),
  closeVersionModal: () => set({ isVersionModalOpen: false }),
  
  saveVersion: (description) => set((state) => {
    // Find the highest version number in history to determine the next version
    let highestVersion = 'v0';
    
    if (state.versions.length > 0) {
      highestVersion = state.versions[0].version || state.versions[0].data.projectVersion || 'v0';
      state.versions.forEach(v => {
        const vStr = v.version || v.data.projectVersion;
        if (vStr && vStr.localeCompare(highestVersion, undefined, { numeric: true, sensitivity: 'base' }) > 0) {
          highestVersion = vStr;
        }
      });
    } else {
      // If history is empty, use current projectVersion as base if it's not v0
      if (state.projectVersion !== 'v0') {
        highestVersion = state.projectVersion;
      }
    }
    
    let nextVersion = highestVersion;
    const match = nextVersion.match(/(.*?)(\d+)$/);
    if (match) {
      nextVersion = match[1] + (parseInt(match[2]) + 1);
    } else {
      nextVersion += '.1';
    }

    const newVersion: ProjectVersion = {
      id: `v${Date.now()}`,
      version: nextVersion,
      description,
      timestamp: Date.now(),
      data: {
        clientName: state.clientName,
        projectName: state.projectName,
        projectVersion: nextVersion,
        tasks: state.tasks,
        groups: state.groups,
        viewMode: state.viewMode,
        zoomLevel: state.zoomLevel,
      }
    };
    return { 
      projectVersion: nextVersion,
      versions: [newVersion, ...state.versions] 
    };
  }),
  restoreVersion: (id) => set((state) => {
    const version = state.versions.find(v => v.id === id);
    if (!version) return state;
    const bounds = calculateBounds(version.data.tasks, version.data.viewMode);
    return {
      clientName: version.data.clientName || state.clientName,
      projectName: version.data.projectName || state.projectName,
      projectVersion: version.version || version.data.projectVersion || state.projectVersion,
      tasks: version.data.tasks,
      groups: version.data.groups,
      viewMode: version.data.viewMode,
      zoomLevel: version.data.zoomLevel,
      chartStartDate: bounds.chartStartDate,
      chartEndDate: bounds.chartEndDate,
    };
  }),
  deleteVersion: (id) => set((state) => {
    const newVersions = state.versions.filter(v => v.id !== id);
    // If we delete the "current" version, update projectVersion to the new latest if available
    const latestVersion = newVersions[0];
    return {
      versions: newVersions,
      projectVersion: latestVersion ? (latestVersion.version || latestVersion.data.projectVersion) : 'v0'
    };
  }),
  importProject: (data: ProjectState) => set((state) => {
    const bounds = calculateBounds(data.tasks, data.viewMode || 'weekly');
    
    // Parse dates in versions if they are strings
    const parsedVersions = (data.versions || []).map(v => ({
      ...v,
      data: {
        ...v.data,
        tasks: v.data.tasks.map(t => ({
          ...t,
          startDate: new Date(t.startDate),
          endDate: new Date(t.endDate)
        }))
      }
    }));

    return {
      clientName: data.clientName || 'Client A',
      projectName: data.projectName || 'New Project',
      projectVersion: data.projectVersion || 'v0',
      tasks: data.tasks,
      groups: data.groups,
      versions: parsedVersions,
      viewMode: data.viewMode || 'weekly',
      zoomLevel: data.zoomLevel || 100,
      chartStartDate: bounds.chartStartDate,
      chartEndDate: bounds.chartEndDate,
    };
  }),

  isTaskModalOpen: false,
  editingTaskId: null,
  openTaskModal: (taskId) => set({ isTaskModalOpen: true, editingTaskId: taskId || null }),
  closeTaskModal: () => set({ isTaskModalOpen: false, editingTaskId: null }),

  setTasks: (tasks) => set((state) => ({ ...pushHistory(state), tasks })),
  updateTask: (id, updates) => set((state) => {
    const newTasks = state.tasks.map(t => t.id === id ? { ...t, ...updates } : t);
    const bounds = calculateBounds(newTasks, state.viewMode);
    return {
      ...pushHistory(state),
      tasks: newTasks,
      chartStartDate: bounds.chartStartDate,
      chartEndDate: bounds.chartEndDate,
    };
  }),
  updateTaskDates: (id, startDate, endDate) => set((state) => {
    const newTasks = state.tasks.map(t => t.id === id ? { ...t, startDate, endDate } : t);
    const bounds = calculateBounds(newTasks, state.viewMode);
    return {
      tasks: newTasks,
      chartStartDate: bounds.chartStartDate < state.chartStartDate ? bounds.chartStartDate : state.chartStartDate,
      chartEndDate: bounds.chartEndDate > state.chartEndDate ? bounds.chartEndDate : state.chartEndDate,
    };
  }),
  commitTaskDates: (id, initialStartDate, initialEndDate, newStartDate, newEndDate) => set((state) => {
    // First, revert to initial state to push to history
    const revertedTasks = state.tasks.map(t => t.id === id ? { ...t, startDate: initialStartDate, endDate: initialEndDate } : t);
    const stateToPush = { ...state, tasks: revertedTasks };
    
    // Then apply the new state
    const newTasks = state.tasks.map(t => t.id === id ? { ...t, startDate: newStartDate, endDate: newEndDate } : t);
    const bounds = calculateBounds(newTasks, state.viewMode);
    
    return {
      ...pushHistory(stateToPush),
      tasks: newTasks,
      chartStartDate: bounds.chartStartDate,
      chartEndDate: bounds.chartEndDate,
    };
  }),
  addTask: (taskData) => set((state) => {
    const newTask = { ...taskData, id: `t${Date.now()}`, progress: taskData.progress ?? 0 };
    const newTasks = [...state.tasks, newTask];
    const bounds = calculateBounds(newTasks, state.viewMode);
    return {
      ...pushHistory(state),
      tasks: newTasks,
      chartStartDate: bounds.chartStartDate,
      chartEndDate: bounds.chartEndDate,
    };
  }),
  deleteTask: (id) => set((state) => {
    const newTasks = state.tasks.filter(t => t.id !== id);
    const bounds = calculateBounds(newTasks, state.viewMode);
    return {
      ...pushHistory(state),
      tasks: newTasks,
      chartStartDate: bounds.chartStartDate,
      chartEndDate: bounds.chartEndDate,
    };
  }),
  updateTaskName: (id, name) => set((state) => ({
    ...pushHistory(state),
    tasks: state.tasks.map(t => t.id === id ? { ...t, name } : t)
  })),
  reorderTasks: (activeId, overId) => set((state) => {
    const oldIndex = state.tasks.findIndex(t => t.id === activeId);
    const newIndex = state.tasks.findIndex(t => t.id === overId);
    if (oldIndex === -1 || newIndex === -1) return state;
    
    const newTasks = [...state.tasks];
    const [movedTask] = newTasks.splice(oldIndex, 1);
    newTasks.splice(newIndex, 0, movedTask);
    return { ...pushHistory(state), tasks: newTasks };
  }),

  addGroup: (group) => set((state) => ({ ...pushHistory(state), groups: [...state.groups, group] })),
  updateGroup: (id, updates) => set((state) => ({
    ...pushHistory(state),
    groups: state.groups.map(g => g.id === id ? { ...g, ...updates } : g)
  })),
  deleteGroup: (id) => set((state) => ({
    ...pushHistory(state),
    groups: state.groups.filter(g => g.id !== id),
    // Optionally handle tasks that belong to this group, e.g., move them to another group or delete them.
    // For now, we'll just delete the group. Tasks might not render their group color.
  })),
  updateGroupColor: (id, color) => set((state) => ({
    ...pushHistory(state),
    groups: state.groups.map(g => g.id === id ? { ...g, color } : g)
  })),

  setViewMode: (viewMode) => set((state) => {
    const bounds = calculateBounds(state.tasks, viewMode);
    return { 
      viewMode,
      chartStartDate: bounds.chartStartDate,
      chartEndDate: bounds.chartEndDate
    };
  }),
  setZoomLevel: (zoomLevel) => set({ zoomLevel: Math.max(20, Math.min(300, zoomLevel)) }),
  setChartDates: (chartStartDate, chartEndDate) => set({ chartStartDate, chartEndDate }),
  resetProject: () => {
    const emptyTasks: Task[] = [];
    const emptyGroups: Group[] = [{ id: 'g1', name: 'Group 1', color: '#3b82f6' }];
    const bounds = calculateBounds(emptyTasks, 'weekly');
    set({
      clientName: 'New Client',
      projectName: 'New Project',
      projectVersion: 'v0',
      tasks: emptyTasks,
      groups: emptyGroups,
      viewMode: 'weekly',
      zoomLevel: 100,
      chartStartDate: bounds.chartStartDate,
      chartEndDate: bounds.chartEndDate,
      past: [],
      future: [],
      versions: [],
      rowHeights: {},
      sidebarWidth: 320,
    });
  },
}));
