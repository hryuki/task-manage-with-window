import { exec } from 'child_process';
import { app } from 'electron';
import { join } from 'path';
import { promisify } from 'util';
import { ActiveWindow, TaskWindow } from '../shared/types';

const execAsync = promisify(exec);

// ウィンドウキャッシュ（アプリ名|||ウィンドウタイトル -> ActiveWindow）
// 一度取得したウィンドウ情報をキャッシュし、別Spaceのウィンドウも表示できるようにする
const windowCache = new Map<string, ActiveWindow>();

// キャッシュの有効期限（ミリ秒）- 5分
const CACHE_EXPIRY_MS = 5 * 60 * 1000;

// キャッシュエントリのタイムスタンプ
const cacheTimestamps = new Map<string, number>();

// Swiftヘルパースクリプトのパスを取得（ウィンドウ一覧取得用）
function getSwiftHelperPath(): string {
  const isDev = !app.isPackaged;
  if (isDev) {
    return join(__dirname, '../../resources/get_electron_windows.swift');
  }
  return join(process.resourcesPath, 'get_electron_windows.swift');
}

// ウィンドウアクティベート用Swiftスクリプトのパスを取得
function getActivateWindowHelperPath(): string {
  const isDev = !app.isPackaged;
  if (isDev) {
    return join(__dirname, '../../resources/activate_window.swift');
  }
  return join(process.resourcesPath, 'activate_window.swift');
}

// キャッシュキーを生成
function getCacheKey(appName: string, windowTitle: string): string {
  return `${appName}|||${windowTitle}`;
}

// 期限切れのキャッシュエントリを削除
function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [key, timestamp] of cacheTimestamps.entries()) {
    if (now - timestamp > CACHE_EXPIRY_MS) {
      windowCache.delete(key);
      cacheTimestamps.delete(key);
    }
  }
}

// 現在開いているウィンドウ一覧を取得
// キャッシュを併用して、別Spaceにあるウィンドウも表示
export async function getActiveWindows(): Promise<ActiveWindow[]> {
  try {
    // Swiftヘルパースクリプトを実行してウィンドウを取得
    const swiftHelperPath = getSwiftHelperPath();
    const { stdout } = await execAsync(`swift "${swiftHelperPath}"`, {
      timeout: 10000, // 10秒タイムアウト
    });

    const currentWindows: ActiveWindow[] = [];
    const lines = stdout.trim().split('\n');
    const now = Date.now();

    let windowId = 0;
    for (const line of lines) {
      const parts = line.split('|||');
      if (parts.length >= 2) {
        const appName = parts[0].trim();
        const windowTitle = parts[1].trim();
        if (appName && windowTitle) {
          const window: ActiveWindow = {
            appName,
            windowTitle,
            windowId: windowId++,
          };
          currentWindows.push(window);

          // キャッシュを更新
          const cacheKey = getCacheKey(appName, windowTitle);
          windowCache.set(cacheKey, window);
          cacheTimestamps.set(cacheKey, now);
        }
      }
    }

    // 期限切れのキャッシュを削除
    cleanExpiredCache();

    // 現在取得できたウィンドウのキーを集める
    const currentKeys = new Set(
      currentWindows.map(w => getCacheKey(w.appName, w.windowTitle))
    );

    // キャッシュから、現在取得できなかったウィンドウを追加
    // （別Spaceにあるウィンドウ）
    for (const [key, cachedWindow] of windowCache.entries()) {
      if (!currentKeys.has(key)) {
        currentWindows.push({
          ...cachedWindow,
          windowId: windowId++,
        });
      }
    }

    return currentWindows;
  } catch (error) {
    console.error('Failed to get active windows with Swift helper:', error);
    // フォールバック: 従来のAppleScriptを使用
    return getActiveWindowsFallback();
  }
}

// フォールバック用の従来のAppleScript実装
async function getActiveWindowsFallback(): Promise<ActiveWindow[]> {
  const script = `
    set windowList to {}
    tell application "System Events"
      set allProcesses to every process whose visible is true
      repeat with proc in allProcesses
        set appName to displayed name of proc
        try
          set procWindows to every window of proc
          repeat with win in procWindows
            try
              set winTitle to name of win
              if winTitle is not "" then
                set end of windowList to appName & "|||" & winTitle
              end if
            end try
          end repeat
        on error
        end try
      end repeat
    end tell
    return windowList
  `;

  try {
    const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);

    const windows: ActiveWindow[] = [];
    const lines = stdout.trim().split(', ');

    let windowId = 0;
    for (const line of lines) {
      const parts = line.split('|||');
      if (parts.length >= 2) {
        const appName = parts[0].trim();
        const windowTitle = parts[1].trim();
        if (appName && windowTitle) {
          windows.push({
            appName,
            windowTitle,
            windowId: windowId++,
          });
        }
      }
    }

    return windows;
  } catch (error) {
    console.error('Failed to get active windows with fallback:', error);
    return [];
  }
}

// 特定のアプリをアクティブにする
export async function activateApp(appName: string): Promise<boolean> {
  const script = `
    tell application "${appName}"
      activate
    end tell
  `;

  try {
    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    return true;
  } catch (error) {
    console.error(`Failed to activate app ${appName}:`, error);
    return false;
  }
}

// 特定のアプリのウィンドウをアクティブにする（タイトルで一致）
// Electronベースのアプリ（VS Code, Antigravityなど）にも対応
export async function activateWindow(appName: string, windowTitlePattern?: string): Promise<boolean> {
  try {
    if (windowTitlePattern) {
      // Swiftヘルパースクリプトを使用してウィンドウをアクティベート
      // これによりElectronアプリのウィンドウも正しく識別・アクティベート可能
      const activateHelperPath = getActivateWindowHelperPath();
      const escapedAppName = appName.replace(/"/g, '\\"');
      const escapedTitle = windowTitlePattern.replace(/"/g, '\\"');

      await execAsync(`swift "${activateHelperPath}" "${escapedAppName}" "${escapedTitle}"`, {
        timeout: 10000,
      });
      return true;
    } else {
      // ウィンドウタイトルが指定されていない場合は従来のAppleScriptを使用
      const script = `tell application "${appName}" to activate`;
      await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
      return true;
    }
  } catch (error) {
    console.error(`Failed to activate window ${appName} - ${windowTitlePattern}:`, error);
    // フォールバック: 従来のAppleScriptを試す
    try {
      const script = `tell application "${appName}" to activate`;
      await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
      return true;
    } catch {
      return false;
    }
  }
}

// タスクに紐づくアプリウィンドウをアクティブにする
export async function switchToTaskWindows(taskWindows: TaskWindow[]): Promise<void> {
  // アプリタイプのウィンドウのみ処理（Chromeタブは別途WebSocket経由で処理）
  const appWindows = taskWindows.filter(tw => tw.type === 'app');

  for (const tw of appWindows) {
    if (tw.appName) {
      await activateWindow(tw.appName, tw.windowTitle);
    }
  }
}

// キャッシュをクリア（デバッグ用）
export function clearWindowCache(): void {
  windowCache.clear();
  cacheTimestamps.clear();
}

// キャッシュの状態を取得（デバッグ用）
export function getWindowCacheStatus(): { size: number; keys: string[] } {
  return {
    size: windowCache.size,
    keys: Array.from(windowCache.keys()),
  };
}
