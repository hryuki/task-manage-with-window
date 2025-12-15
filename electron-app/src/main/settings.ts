import { app } from 'electron';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// 設定ファイルのパス
const SETTINGS_DIR = join(app.getPath('userData'), 'settings');
const SETTINGS_FILE = join(SETTINGS_DIR, 'preferences.json');

// デフォルト設定
const DEFAULT_SETTINGS: AppSettings = {
    shortcut: 'CommandOrControl+Shift+T',
    opacity: 0.95,
};

// 設定の型定義
export interface AppSettings {
    shortcut: string;        // グローバルショートカット
    opacity: number;         // ウィンドウの透明度（0.0〜1.0）
}

// 設定を読み込み
export function loadSettings(): AppSettings {
    try {
        if (existsSync(SETTINGS_FILE)) {
            const data = readFileSync(SETTINGS_FILE, 'utf-8');
            const parsed = JSON.parse(data);
            return { ...DEFAULT_SETTINGS, ...parsed };
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
}

// 設定を保存
export function saveSettings(settings: AppSettings): boolean {
    try {
        // ディレクトリがなければ作成
        if (!existsSync(SETTINGS_DIR)) {
            mkdirSync(SETTINGS_DIR, { recursive: true });
        }
        writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('Failed to save settings:', error);
        return false;
    }
}

// ショートカットを更新
export function updateShortcut(shortcut: string): boolean {
    const settings = loadSettings();
    settings.shortcut = shortcut;
    return saveSettings(settings);
}

// 透明度を更新
export function updateOpacity(opacity: number): boolean {
    const settings = loadSettings();
    settings.opacity = Math.max(0.3, Math.min(1.0, opacity)); // 0.3〜1.0に制限
    return saveSettings(settings);
}

// 利用可能なショートカットオプション
export const SHORTCUT_OPTIONS = [
    'CommandOrControl+Shift+T',
    'CommandOrControl+Shift+Space',
    'CommandOrControl+Option+T',
    'CommandOrControl+Option+Space',
    'Option+Space',
    'F12',
];
