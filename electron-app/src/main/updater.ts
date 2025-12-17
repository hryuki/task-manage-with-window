import { dialog } from 'electron';
import { autoUpdater } from 'electron-updater';

// ログを有効化
autoUpdater.logger = console;

// 自動ダウンロードを有効化
autoUpdater.autoDownload = true;

// 自動インストールは無効（ユーザーに確認後にインストール）
autoUpdater.autoInstallOnAppQuit = true;

// イベントリスナーが登録済みかどうか
let listenersRegistered = false;

/**
 * アップデーターのイベントリスナーを設定（一度だけ）
 */
function setupUpdateListeners(): void {
    if (listenersRegistered) return;
    listenersRegistered = true;

    // アップデートが利用可能
    autoUpdater.on('update-available', (info) => {
        console.log('[Updater] 新しいバージョンが見つかりました:', info.version);
        dialog.showMessageBox({
            type: 'info',
            title: 'アップデート',
            message: `新しいバージョン ${info.version} が見つかりました`,
            detail: 'バックグラウンドでダウンロードを開始します...',
            buttons: ['OK'],
        });
    });

    // アップデートがない
    autoUpdater.on('update-not-available', () => {
        console.log('[Updater] 最新バージョンです');
    });

    // ダウンロード進捗
    autoUpdater.on('download-progress', (progress) => {
        console.log(`[Updater] ダウンロード中: ${Math.round(progress.percent)}%`);
    });

    // ダウンロード完了
    autoUpdater.on('update-downloaded', (info) => {
        console.log('[Updater] ダウンロード完了:', info.version);

        // ユーザーに確認ダイアログを表示
        dialog
            .showMessageBox({
                type: 'info',
                title: 'アップデート',
                message: `新しいバージョン ${info.version} がダウンロードされました`,
                detail: '今すぐ再起動してアップデートしますか？',
                buttons: ['今すぐ再起動', '後で'],
                defaultId: 0,
                cancelId: 1,
            })
            .then((result) => {
                if (result.response === 0) {
                    // 再起動してインストール
                    autoUpdater.quitAndInstall();
                }
            });
    });

    // エラーハンドリング
    autoUpdater.on('error', (error) => {
        console.error('[Updater] エラー:', error);
    });
}

/**
 * アップデートをチェックする（起動時の自動チェック用）
 */
export function checkForUpdates(): void {
    console.log('[Updater] アップデートチェックを開始...');

    setupUpdateListeners();

    // アップデートチェック実行
    autoUpdater.checkForUpdates().catch((error) => {
        console.error('[Updater] チェック失敗:', error);
    });
}

/**
 * 手動でアップデートをチェックする（メニューから呼び出し用）
 * ユーザーに結果を通知する
 */
export async function checkForUpdatesManual(): Promise<void> {
    console.log('[Updater] 手動アップデートチェックを開始...');

    setupUpdateListeners();

    try {
        const result = await autoUpdater.checkForUpdates();
        if (result === null) {
            dialog.showMessageBox({
                type: 'info',
                title: 'アップデート',
                message: 'アップデートの確認に失敗しました',
                detail: 'ネットワーク接続を確認してください。',
                buttons: ['OK'],
            });
        } else if (result.updateInfo.version === autoUpdater.currentVersion.version) {
            dialog.showMessageBox({
                type: 'info',
                title: 'アップデート',
                message: '最新バージョンです',
                detail: `現在のバージョン: ${autoUpdater.currentVersion.version}`,
                buttons: ['OK'],
            });
        }
        // 新しいバージョンがある場合は 'update-available' イベントで通知される
    } catch (error) {
        console.error('[Updater] 手動チェック失敗:', error);
        dialog.showMessageBox({
            type: 'error',
            title: 'アップデート',
            message: 'アップデートの確認中にエラーが発生しました',
            detail: String(error),
            buttons: ['OK'],
        });
    }
}

/**
 * 現在のバージョンを取得
 */
export function getCurrentVersion(): string {
    return autoUpdater.currentVersion.version;
}
