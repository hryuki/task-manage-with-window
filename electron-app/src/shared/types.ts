// 共通の型定義

// タスク（階層構造対応）
export interface Task {
    id: string;
    name: string;
    parentId: string | null;  // 親タスクID（nullはルートタスク）
    order: number;            // 同階層内での順序
    completed: boolean;       // タスク完了フラグ
    createdAt: string;
    updatedAt: string;
}

// タスクに紐づくウィンドウ/アプリ
export interface TaskWindow {
    id: string;
    taskId: string;
    type: 'app' | 'chrome-tab';

    // type === 'app' の場合
    appName?: string;         // 例: "Visual Studio Code"
    windowTitle?: string;     // 例: "project-name"（部分一致で検索）

    // type === 'chrome-tab' の場合
    tabUrl?: string;          // URLパターン（部分一致）
    tabTitle?: string;        // タブタイトル（部分一致）
}

// 現在開いているウィンドウ情報（一時データ）
export interface ActiveWindow {
    appName: string;
    windowTitle: string;
    windowId: number;
}

// 現在開いているChromeタブ情報（一時データ）
export interface ActiveChromeTab {
    tabId: number;
    windowId: number;
    url: string;
    title: string;
}

// WebSocket通信用メッセージ
export interface WSMessage {
    type: 'get-tabs' | 'tabs-list' | 'activate-tab' | 'tab-activated' | 'connection-status';
    payload?: unknown;
}

export interface TabsListPayload {
    tabs: ActiveChromeTab[];
}

export interface ActivateTabPayload {
    tabId: number;
    windowId: number;
}

// IPC通信用チャンネル
export const IPC_CHANNELS = {
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
