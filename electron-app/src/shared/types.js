"use strict";
// 共通の型定義
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = void 0;
// IPC通信用チャンネル
exports.IPC_CHANNELS = {
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
};
