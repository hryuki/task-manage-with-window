import { exec } from 'child_process';
import { promisify } from 'util';
import { ActiveWindow, TaskWindow } from '../shared/types';

const execAsync = promisify(exec);

// 現在開いているウィンドウ一覧を取得
export async function getActiveWindows(): Promise<ActiveWindow[]> {
  // より堅牢なAppleScript - 全てのアプリケーションのウィンドウを取得
  const script = `
    set windowList to {}
    tell application "System Events"
      set allProcesses to every process whose visible is true
      repeat with proc in allProcesses
        set appName to name of proc
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
          -- ウィンドウ取得に失敗した場合はスキップ
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
    console.error('Failed to get active windows:', error);
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
