import { ipcMain } from 'electron';
import { IPC_CHANNELS, Task, TaskWindow } from '../shared/types';
import {
    addTaskWindow,
    createTask,
    deleteTask,
    getAllTasks,
    getTaskWindows,
    removeTaskWindow,
    updateTask
} from './database';
import { hideFloatingWindow, toggleFloatingWindow } from './floatingWindow';
import { activateChromeTabByTitle, activateChromeTabByUrl, getChromeTabs } from './websocketServer';
import { getActiveWindows, switchToTaskWindows } from './windowController';

export function setupIpcHandlers() {
    // === タスク関連 ===

    ipcMain.handle(IPC_CHANNELS.GET_TASKS, async () => {
        return getAllTasks();
    });

    ipcMain.handle(IPC_CHANNELS.CREATE_TASK, async (_, name: string, parentId: string | null) => {
        return createTask(name, parentId);
    });

    ipcMain.handle(IPC_CHANNELS.UPDATE_TASK, async (_, id: string, updates: Partial<Task>) => {
        return updateTask(id, updates);
    });

    ipcMain.handle(IPC_CHANNELS.DELETE_TASK, async (_, id: string) => {
        return deleteTask(id);
    });

    // === タスクウィンドウ関連 ===

    ipcMain.handle(IPC_CHANNELS.GET_TASK_WINDOWS, async (_, taskId: string) => {
        return getTaskWindows(taskId);
    });

    ipcMain.handle(IPC_CHANNELS.ADD_TASK_WINDOW, async (_, taskWindow: Omit<TaskWindow, 'id'>) => {
        return addTaskWindow(taskWindow);
    });

    ipcMain.handle(IPC_CHANNELS.REMOVE_TASK_WINDOW, async (_, id: string) => {
        return removeTaskWindow(id);
    });

    // === ウィンドウ制御 ===

    ipcMain.handle(IPC_CHANNELS.SWITCH_TO_TASK, async (_, taskId: string) => {
        // タスクに紐づくウィンドウ設定を取得
        const taskWindows = getTaskWindows(taskId);

        // アプリウィンドウをアクティブにする
        await switchToTaskWindows(taskWindows);

        // Chromeタブをアクティブにする
        const chromeTabWindows = taskWindows.filter(tw => tw.type === 'chrome-tab');
        for (const tw of chromeTabWindows) {
            if (tw.tabUrl) {
                await activateChromeTabByUrl(tw.tabUrl);
            } else if (tw.tabTitle) {
                await activateChromeTabByTitle(tw.tabTitle);
            }
        }

        return true;
    });

    ipcMain.handle(IPC_CHANNELS.GET_ACTIVE_WINDOWS, async () => {
        return getActiveWindows();
    });

    ipcMain.handle(IPC_CHANNELS.GET_CHROME_TABS, async () => {
        return getChromeTabs();
    });

    // === ウィンドウ表示制御 ===

    ipcMain.handle(IPC_CHANNELS.TOGGLE_WINDOW, async () => {
        toggleFloatingWindow();
    });

    ipcMain.handle(IPC_CHANNELS.HIDE_WINDOW, async () => {
        hideFloatingWindow();
    });
}
