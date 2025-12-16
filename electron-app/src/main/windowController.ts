import { exec } from 'child_process';
import { app } from 'electron';
import { join } from 'path';
import { promisify } from 'util';
import { ActiveWindow, TaskWindow } from '../shared/types';

const execAsync = promisify(exec);

// Swiftヘルパースクリプトのパスを取得
function getSwiftHelperPath(): string {
  // 開発環境とパッケージ環境の両方に対応
  const isDev = !app.isPackaged;
  if (isDev) {
    return join(__dirname, '../../resources/get_electron_windows.swift');
  }
  return join(process.resourcesPath, 'get_electron_windows.swift');
}

// 現在開いているウィンドウ一覧を取得
// AXManualAccessibilityを有効にしてElectronベースのアプリ（VS Code, Antigravityなど）のウィンドウも取得
export async function getActiveWindows(): Promise<ActiveWindow[]> {
  try {
    // Swiftヘルパースクリプトを実行してAXManualAccessibilityを有効にしたウィンドウを取得
    const swiftHelperPath = getSwiftHelperPath();
    const { stdout } = await execAsync(`swift "${swiftHelperPath}"`, {
      timeout: 10000, // 10秒タイムアウト
    });

    const windows: ActiveWindow[] = [];
    const lines = stdout.trim().split('\n');

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

// 特定のアプリのウィンドウをアクティブにする（タイトルで部分一致）
export async function activateWindow(appName: string, windowTitlePattern?: string): Promise<boolean> {
  let script: string;

  if (windowTitlePattern) {
    script = `
      tell application "System Events"
        tell process "${appName}"
          set frontmost to true
          set allWindows to every window
          repeat with win in allWindows
            if name of win contains "${windowTitlePattern}" then
              perform action "AXRaise" of win
              return true
            end if
          end repeat
        end tell
      end tell
      tell application "${appName}" to activate
      return true
    `;
  } else {
    script = `
      tell application "${appName}" to activate
      return true
    `;
  }

  try {
    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    return true;
  } catch (error) {
    console.error(`Failed to activate window ${appName} - ${windowTitlePattern}:`, error);
    return false;
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
