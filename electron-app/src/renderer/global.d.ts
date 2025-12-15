/* グローバル型定義 */
import type { ElectronAPI } from '../main/preload';

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

export { };

