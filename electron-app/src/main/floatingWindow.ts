import { BrowserWindow, screen } from 'electron';
import { join } from 'path';
import { loadSettings } from './settings';

let floatingWindow: BrowserWindow | null = null;

export async function createFloatingWindow(isDev: boolean) {
    // 設定を読み込み
    const settings = loadSettings();

    // ディスプレイサイズ取得
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    // ウィンドウサイズ
    const windowWidth = 320;
    const windowHeight = 480;

    // 右下に配置
    const x = screenWidth - windowWidth - 20;
    const y = screenHeight - windowHeight - 20;

    floatingWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        x,
        y,
        frame: false,              // フレームレス
        transparent: true,         // 透過
        alwaysOnTop: true,         // 常に最前面
        resizable: false,
        skipTaskbar: true,         // タスクバーに表示しない
        show: false,               // 初期状態は非表示
        opacity: settings.opacity, // 半透明
        hasShadow: true,           // シャドウを有効に
        vibrancy: 'under-window',  // macOSのぼかし効果
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: join(__dirname, 'preload.js'),
        },
    });

    // すべてのデスクトップ（Spaces）で表示
    floatingWindow.setVisibleOnAllWorkspaces(true);

    // ウィンドウがフォーカスを失っても隠さない
    // ユーザーが明示的に隠すまで表示し続ける

    // 開発モードではViteの開発サーバーに接続
    if (isDev) {
        await floatingWindow.loadURL('http://localhost:5173');
        // 開発者ツールを開く（デバッグ用）
        // floatingWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        await floatingWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }

    return floatingWindow;
}

export function getFloatingWindow() {
    return floatingWindow;
}

export function showFloatingWindow() {
    if (floatingWindow) {
        floatingWindow.show();
        floatingWindow.focus();
    }
}

export function hideFloatingWindow() {
    if (floatingWindow) {
        floatingWindow.hide();
    }
}

export function toggleFloatingWindow() {
    if (floatingWindow) {
        if (floatingWindow.isVisible()) {
            floatingWindow.hide();
        } else {
            floatingWindow.show();
            floatingWindow.focus();
        }
    }
}

// ウィンドウの透明度を設定
export function setWindowOpacity(opacity: number) {
    if (floatingWindow) {
        const clampedOpacity = Math.max(0.3, Math.min(1.0, opacity));
        floatingWindow.setOpacity(clampedOpacity);
    }
}
