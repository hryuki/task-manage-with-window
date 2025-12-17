import { app, globalShortcut, Menu, nativeImage, NativeImage, Tray } from 'electron';
import { join } from 'path';
import { hideFloatingWindow, setWindowOpacity, showFloatingWindow, toggleFloatingWindow } from './floatingWindow';
import { loadSettings, SHORTCUT_OPTIONS, updateOpacity, updateShortcut } from './settings';
import { checkForUpdatesManual, getCurrentVersion } from './updater';

let tray: Tray | null = null;
let currentShortcut: string | null = null;

// グローバルショートカットを登録
export function registerGlobalShortcut() {
    const settings = loadSettings();

    // 既存のショートカットを解除
    if (currentShortcut) {
        globalShortcut.unregister(currentShortcut);
        currentShortcut = null;
    }

    // 新しいショートカットを登録
    try {
        const success = globalShortcut.register(settings.shortcut, () => {
            toggleFloatingWindow();
        });

        if (success) {
            currentShortcut = settings.shortcut;
            console.log(`Global shortcut registered: ${settings.shortcut}`);
        } else {
            console.error(`Failed to register shortcut: ${settings.shortcut}`);
        }
    } catch (error) {
        console.error('Error registering shortcut:', error);
    }
}

// グローバルショートカットを解除
export function unregisterGlobalShortcut() {
    if (currentShortcut) {
        globalShortcut.unregister(currentShortcut);
        currentShortcut = null;
    }
}

// ショートカットを変更
export function changeShortcut(newShortcut: string) {
    if (updateShortcut(newShortcut)) {
        registerGlobalShortcut();
        updateTrayMenu();
    }
}

// 透明度を変更
export function changeOpacity(opacity: number) {
    if (updateOpacity(opacity)) {
        setWindowOpacity(opacity);
        updateTrayMenu();
    }
}

// トレイメニューを更新
function updateTrayMenu() {
    if (!tray) return;

    const settings = loadSettings();

    // ショートカットサブメニュー
    const shortcutSubmenu: Electron.MenuItemConstructorOptions[] = SHORTCUT_OPTIONS.map(shortcut => ({
        label: shortcut,
        type: 'radio' as const,
        checked: settings.shortcut === shortcut,
        click: () => changeShortcut(shortcut),
    }));

    // 透明度サブメニュー
    const opacityOptions = [
        { label: '100%（不透明）', value: 1.0 },
        { label: '95%', value: 0.95 },
        { label: '90%', value: 0.9 },
        { label: '85%', value: 0.85 },
        { label: '80%', value: 0.8 },
        { label: '70%', value: 0.7 },
        { label: '50%', value: 0.5 },
    ];

    const opacitySubmenu: Electron.MenuItemConstructorOptions[] = opacityOptions.map(opt => ({
        label: opt.label,
        type: 'radio' as const,
        checked: Math.abs(settings.opacity - opt.value) < 0.01,
        click: () => changeOpacity(opt.value),
    }));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'ウィンドウを表示',
            accelerator: settings.shortcut,
            click: () => showFloatingWindow(),
        },
        {
            label: 'ウィンドウを非表示',
            click: () => hideFloatingWindow(),
        },
        { type: 'separator' },
        {
            label: '設定',
            submenu: [
                {
                    label: 'ショートカットキー',
                    submenu: shortcutSubmenu,
                },
                {
                    label: '透明度',
                    submenu: opacitySubmenu,
                },
            ],
        },
        { type: 'separator' },
        {
            label: `アップデートを確認 (v${getCurrentVersion()})`,
            click: () => checkForUpdatesManual(),
        },
        { type: 'separator' },
        {
            label: '終了',
            click: () => {
                unregisterGlobalShortcut();
                app.quit();
            },
        },
    ]);

    tray.on('right-click', () => {
        tray?.popUpContextMenu(contextMenu);
    });
}

export function createTray() {
    // メニューバーアイコン作成（Templateを使用してダークモード対応）
    const iconPath = join(__dirname, '../../resources/icon.png');

    // アイコンが存在しない場合は空のアイコンを作成
    let icon: NativeImage;
    try {
        icon = nativeImage.createFromPath(iconPath);
        // macOSのメニューバー用にリサイズ（16x16または22x22推奨）
        icon = icon.resize({ width: 16, height: 16 });
    } catch {
        // フォールバック: 空のアイコン
        icon = nativeImage.createEmpty();
    }

    tray = new Tray(icon);
    tray.setToolTip('Task Manager');

    // クリックでフローティングウィンドウ表示/非表示
    tray.on('click', () => {
        toggleFloatingWindow();
    });

    // コンテキストメニューを設定
    updateTrayMenu();

    // グローバルショートカットを登録
    registerGlobalShortcut();

    return tray;
}

export function getTray() {
    return tray;
}
