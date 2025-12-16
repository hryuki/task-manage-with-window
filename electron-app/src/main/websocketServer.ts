import { WebSocket, WebSocketServer } from 'ws';
import { ActivateTabPayload, ActiveChromeTab, TabsListPayload, WSMessage } from '../shared/types';

const PORT = 9876;
let wss: WebSocketServer | null = null;
let chromeExtensionSocket: WebSocket | null = null;
let chromeTabs: ActiveChromeTab[] = [];
let pendingTabsRequest: ((tabs: ActiveChromeTab[]) => void) | null = null;

export function startWebSocketServer() {
    try {
        wss = new WebSocketServer({ port: PORT });

        console.log(`WebSocket server started on port ${PORT}`);

        wss.on('connection', (ws) => {
            console.log('Chrome extension connected');
            chromeExtensionSocket = ws;

            ws.on('message', (data) => {
                try {
                    const message: WSMessage = JSON.parse(data.toString());
                    handleMessage(message);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            });

            ws.on('close', () => {
                console.log('Chrome extension disconnected');
                chromeExtensionSocket = null;
                chromeTabs = [];
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });

        // サーバーエラーハンドリング（ポート競合など）
        wss.on('error', (error: NodeJS.ErrnoException) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`Port ${PORT} is already in use. Another instance may be running.`);
                console.error('Please close the other instance and try again.');
            } else {
                console.error('WebSocket server error:', error);
            }
        });

    } catch (error) {
        console.error('Failed to start WebSocket server:', error);
    }
}

export function stopWebSocketServer() {
    if (wss) {
        wss.close();
        wss = null;
        chromeExtensionSocket = null;
    }
}

function handleMessage(message: WSMessage) {
    switch (message.type) {
        case 'tabs-list':
            const payload = message.payload as TabsListPayload;
            chromeTabs = payload.tabs;
            if (pendingTabsRequest) {
                pendingTabsRequest(chromeTabs);
                pendingTabsRequest = null;
            }
            break;

        case 'tab-activated':
            console.log('Tab activated successfully');
            break;

        case 'connection-status':
            console.log('Connection status:', message.payload);
            break;
    }
}

// Chrome拡張にメッセージを送信
function sendToExtension(message: WSMessage): boolean {
    if (chromeExtensionSocket && chromeExtensionSocket.readyState === WebSocket.OPEN) {
        chromeExtensionSocket.send(JSON.stringify(message));
        return true;
    }
    return false;
}

// Chromeのタブ一覧を取得
export function getChromeTabs(): Promise<ActiveChromeTab[]> {
    return new Promise((resolve) => {
        // タイムアウト設定
        const timeout = setTimeout(() => {
            pendingTabsRequest = null;
            resolve(chromeTabs); // キャッシュされたタブリストを返す
        }, 2000);

        pendingTabsRequest = (tabs) => {
            clearTimeout(timeout);
            resolve(tabs);
        };

        const sent = sendToExtension({ type: 'get-tabs' });
        if (!sent) {
            clearTimeout(timeout);
            pendingTabsRequest = null;
            // 接続されていない場合もキャッシュを返す
            resolve(chromeTabs);
        }
    });
}

// 特定のタブをアクティブにする
export function activateChromeTab(tabId: number, windowId: number): boolean {
    const payload: ActivateTabPayload = { tabId, windowId };
    return sendToExtension({ type: 'activate-tab', payload });
}

// URLパターンでタブを検索してアクティブにする
export async function activateChromeTabByUrl(urlPattern: string): Promise<boolean> {
    const tabs = await getChromeTabs();
    const matchingTab = tabs.find(tab => tab.url.includes(urlPattern));

    if (matchingTab) {
        return activateChromeTab(matchingTab.tabId, matchingTab.windowId);
    }

    return false;
}

// タイトルパターンでタブを検索してアクティブにする
export async function activateChromeTabByTitle(titlePattern: string): Promise<boolean> {
    const tabs = await getChromeTabs();
    const matchingTab = tabs.find(tab => tab.title.includes(titlePattern));

    if (matchingTab) {
        return activateChromeTab(matchingTab.tabId, matchingTab.windowId);
    }

    return false;
}

// Chrome拡張が接続されているかどうか
export function isChromeExtensionConnected(): boolean {
    return chromeExtensionSocket !== null && chromeExtensionSocket.readyState === WebSocket.OPEN;
}
