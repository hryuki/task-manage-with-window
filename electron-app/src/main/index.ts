import { app, globalShortcut } from 'electron';
import { closeDatabase, initDatabase } from './database';
import { createFloatingWindow, getFloatingWindow } from './floatingWindow';
import { setupIpcHandlers } from './ipcHandlers';
import { createTray, unregisterGlobalShortcut } from './tray';
import { startWebSocketServer, stopWebSocketServer } from './websocketServer';

// 開発モードかどうか
const isDev = !app.isPackaged;

async function initialize() {
    // データベース初期化
    initDatabase();

    // WebSocketサーバー起動
    startWebSocketServer();

    // IPC ハンドラー設定
    setupIpcHandlers();

    // フローティングウィンドウ作成
    await createFloatingWindow(isDev);

    // メニューバーのトレイアイコン作成（グローバルショートカットも登録）
    createTray();

    console.log('Task Manager initialized');
}

// Dockアイコンを非表示（メニューバーアプリとして動作）
app.dock?.hide();

// 準備完了時
app.whenReady().then(initialize);

// 全ウィンドウが閉じられても終了しない（メニューバーアプリのため）
app.on('window-all-closed', (e: Event) => {
    e.preventDefault();
});

// アプリ終了時のクリーンアップ
app.on('before-quit', () => {
    unregisterGlobalShortcut();
    globalShortcut.unregisterAll();
    stopWebSocketServer();
    closeDatabase();
});

// macOSでDockアイコンクリック時
app.on('activate', () => {
    const floatingWindow = getFloatingWindow();
    if (floatingWindow) {
        floatingWindow.show();
    }
});
