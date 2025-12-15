import { ActivateTabPayload, ActiveChromeTab, TabsListPayload, WSMessage } from './types';

const WS_URL = 'ws://localhost:9876';
const RECONNECT_INTERVAL = 5000;

let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

// WebSocket接続を確立
function connect() {
    if (socket?.readyState === WebSocket.OPEN) return;

    try {
        socket = new WebSocket(WS_URL);

        socket.onopen = () => {
            console.log('Connected to Task Manager app');
            sendMessage({ type: 'connection-status', payload: { connected: true } });

            // 再接続タイマーがあればクリア
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
        };

        socket.onmessage = async (event) => {
            try {
                const message: WSMessage = JSON.parse(event.data);
                await handleMessage(message);
            } catch (error) {
                console.error('Failed to parse message:', error);
            }
        };

        socket.onclose = () => {
            console.log('Disconnected from Task Manager app');
            socket = null;
            scheduleReconnect();
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

    } catch (error) {
        console.error('Failed to connect:', error);
        scheduleReconnect();
    }
}

// 再接続をスケジュール
function scheduleReconnect() {
    if (reconnectTimer) return;

    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connect();
    }, RECONNECT_INTERVAL);
}

// メッセージを送信
function sendMessage(message: WSMessage) {
    if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
    }
}

// メッセージを処理
async function handleMessage(message: WSMessage) {
    switch (message.type) {
        case 'get-tabs':
            await sendTabsList();
            break;

        case 'activate-tab':
            const payload = message.payload as ActivateTabPayload;
            await activateTab(payload.tabId, payload.windowId);
            break;
    }
}

// 現在のタブ一覧を送信
async function sendTabsList() {
    try {
        const tabs = await chrome.tabs.query({});

        const tabsList: ActiveChromeTab[] = tabs
            .filter(tab => tab.id !== undefined)
            .map(tab => ({
                tabId: tab.id!,
                windowId: tab.windowId,
                url: tab.url || '',
                title: tab.title || '',
            }));

        const payload: TabsListPayload = { tabs: tabsList };
        sendMessage({ type: 'tabs-list', payload });

    } catch (error) {
        console.error('Failed to get tabs:', error);
    }
}

// タブをアクティブにする
async function activateTab(tabId: number, windowId: number) {
    try {
        // ウィンドウをフォーカス
        await chrome.windows.update(windowId, { focused: true });

        // タブをアクティブに
        await chrome.tabs.update(tabId, { active: true });

        sendMessage({ type: 'tab-activated', payload: { tabId, windowId } });

    } catch (error) {
        console.error('Failed to activate tab:', error);
    }
}

// Service Worker起動時に接続
connect();

// 拡張機能アイコンクリック時
chrome.action.onClicked.addListener(() => {
    // 接続状態を確認して再接続
    if (socket?.readyState !== WebSocket.OPEN) {
        connect();
    }
});

// アラームで定期的に接続を確認（Service Workerが終了しても再接続）
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'keepAlive') {
        if (socket?.readyState !== WebSocket.OPEN) {
            connect();
        }
    }
});

console.log('Task Manager Chrome Extension loaded');
