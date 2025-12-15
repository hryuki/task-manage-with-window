import { app, Menu, nativeImage, NativeImage, Tray } from 'electron';
import { join } from 'path';
import { hideFloatingWindow, showFloatingWindow, toggleFloatingWindow } from './floatingWindow';

let tray: Tray | null = null;

export function createTray() {
    // メニューバーアイコン作成（Templateを使用してダークモード対応）
    const iconPath = join(__dirname, '../../resources/iconTemplate.png');

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

    // 右クリックでコンテキストメニュー
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'ウィンドウを表示',
            click: () => showFloatingWindow(),
        },
        {
            label: 'ウィンドウを非表示',
            click: () => hideFloatingWindow(),
        },
        { type: 'separator' },
        {
            label: '終了',
            click: () => {
                app.quit();
            },
        },
    ]);

    tray.on('right-click', () => {
        tray?.popUpContextMenu(contextMenu);
    });

    return tray;
}

export function getTray() {
    return tray;
}
