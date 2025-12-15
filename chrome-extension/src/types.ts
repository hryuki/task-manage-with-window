// 共通の型定義

// WebSocket通信用メッセージ
export interface WSMessage {
    type: 'get-tabs' | 'tabs-list' | 'activate-tab' | 'tab-activated' | 'connection-status';
    payload?: unknown;
}

export interface ActiveChromeTab {
    tabId: number;
    windowId: number;
    url: string;
    title: string;
}

export interface TabsListPayload {
    tabs: ActiveChromeTab[];
}

export interface ActivateTabPayload {
    tabId: number;
    windowId: number;
}
