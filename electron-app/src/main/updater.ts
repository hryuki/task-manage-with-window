import { dialog } from 'electron';
import { autoUpdater } from 'electron-updater';

// ログを有効化
autoUpdater.logger = console;

// 自動ダウンロードを有効化
autoUpdater.autoDownload = true;

// 自動インストールは無効（ユーザーに確認後にインストール）
autoUpdater.autoInstallOnAppQuit = true;

/**
 * アップデートをチェックする
 */
export function checkForUpdates(): void {
    console.log('[Updater] アップデートチェックを開始...');

    // アップデートが利用可能
    autoUpdater.on('update-available', (info) => {
        console.log('[Updater] 新しいバージョンが見つかりました:', info.version);
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

    // アップデートチェック実行
    autoUpdater.checkForUpdates().catch((error) => {
        console.error('[Updater] チェック失敗:', error);
    });
}
