import { contextBridge, ipcRenderer } from 'electron';

// IPC通信用チャンネル（sandbox環境では外部モジュールをrequireできないため直接定義）
const IPC_CHANNELS = {
    // タスク関連
    GET_TASKS: 'get-tasks',
    CREATE_TASK: 'create-task',
    UPDATE_TASK: 'update-task',
    DELETE_TASK: 'delete-task',

    // タスクウィンドウ関連
    GET_TASK_WINDOWS: 'get-task-windows',
    ADD_TASK_WINDOW: 'add-task-window',
    REMOVE_TASK_WINDOW: 'remove-task-window',

    // ウィンドウ制御
    SWITCH_TO_TASK: 'switch-to-task',
    GET_ACTIVE_WINDOWS: 'get-active-windows',
    GET_CHROME_TABS: 'get-chrome-tabs',

    // ウィンドウ表示制御
    TOGGLE_WINDOW: 'toggle-window',
    HIDE_WINDOW: 'hide-window',
} as const;

// 型定義（レンダラー側で使用）
interface Task {
    id: string;
    name: string;
    parentId: string | null;
    order: number;
    createdAt: string;
    updatedAt: string;
}

interface TaskWindow {
    id: string;
    taskId: string;
    type: 'app' | 'chrome-tab';
    appName?: string;
    windowTitle?: string;
    tabUrl?: string;
    tabTitle?: string;
}

interface ActiveWindow {
    appName: string;
    windowTitle: string;
    windowId: number;
}

interface ActiveChromeTab {
    tabId: number;
    windowId: number;
    url: string;
    title: string;
}

// レンダラープロセスに公開するAPI
const electronAPI = {
    // タスク関連
    getTasks: (): Promise<Task[]> =>
        ipcRenderer.invoke(IPC_CHANNELS.GET_TASKS),

    createTask: (name: string, parentId: string | null = null): Promise<Task> =>
        ipcRenderer.invoke(IPC_CHANNELS.CREATE_TASK, name, parentId),

    updateTask: (id: string, updates: Partial<Task>): Promise<Task | null> =>
        ipcRenderer.invoke(IPC_CHANNELS.UPDATE_TASK, id, updates),

    deleteTask: (id: string): Promise<boolean> =>
        ipcRenderer.invoke(IPC_CHANNELS.DELETE_TASK, id),

    // タスクウィンドウ関連
    getTaskWindows: (taskId: string): Promise<TaskWindow[]> =>
        ipcRenderer.invoke(IPC_CHANNELS.GET_TASK_WINDOWS, taskId),

    addTaskWindow: (taskWindow: Omit<TaskWindow, 'id'>): Promise<TaskWindow> =>
        ipcRenderer.invoke(IPC_CHANNELS.ADD_TASK_WINDOW, taskWindow),

    removeTaskWindow: (id: string): Promise<boolean> =>
        ipcRenderer.invoke(IPC_CHANNELS.REMOVE_TASK_WINDOW, id),

    // ウィンドウ制御
    switchToTask: (taskId: string): Promise<boolean> =>
        ipcRenderer.invoke(IPC_CHANNELS.SWITCH_TO_TASK, taskId),

    getActiveWindows: (): Promise<ActiveWindow[]> =>
        ipcRenderer.invoke(IPC_CHANNELS.GET_ACTIVE_WINDOWS),

    getChromeTabs: (): Promise<ActiveChromeTab[]> =>
        ipcRenderer.invoke(IPC_CHANNELS.GET_CHROME_TABS),

    // ウィンドウ表示制御
    toggleWindow: (): Promise<void> =>
        ipcRenderer.invoke(IPC_CHANNELS.TOGGLE_WINDOW),

    hideWindow: (): Promise<void> =>
        ipcRenderer.invoke(IPC_CHANNELS.HIDE_WINDOW),
};

// グローバルに公開
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// TypeScript用の型定義
export type ElectronAPI = typeof electronAPI;
