import React, { useMemo, useState } from 'react';
import { AiFillAppstore, AiFillChrome, AiOutlineClose, AiOutlineSearch } from 'react-icons/ai';
import { ActiveChromeTab, ActiveWindow, TaskWindow } from '../../shared/types';

interface WindowPickerProps {
  taskId: string;
  activeWindows: ActiveWindow[];
  chromeTabs: ActiveChromeTab[];
  onAddWindow: (taskId: string, windowData: Omit<TaskWindow, 'id' | 'taskId'>) => void;
  onClose: () => void;
  onRefresh: () => void;
}

type TabType = 'app' | 'chrome';

const WindowPicker: React.FC<WindowPickerProps> = ({
  taskId,
  activeWindows,
  chromeTabs,
  onAddWindow,
  onClose,
  onRefresh,
}) => {
  const [selectedTab, setSelectedTab] = useState<TabType>('app');
  const [searchQuery, setSearchQuery] = useState('');

  // 検索クエリでフィルタリングしたウィンドウリスト
  const filteredWindows = useMemo(() => {
    if (!searchQuery.trim()) return activeWindows;
    const query = searchQuery.toLowerCase();
    return activeWindows.filter(win => 
      win.appName.toLowerCase().includes(query) ||
      (win.windowTitle && win.windowTitle.toLowerCase().includes(query))
    );
  }, [activeWindows, searchQuery]);

  // 検索クエリでフィルタリングしたChromeタブリスト
  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) return chromeTabs;
    const query = searchQuery.toLowerCase();
    return chromeTabs.filter(tab =>
      tab.title.toLowerCase().includes(query) ||
      tab.url.toLowerCase().includes(query)
    );
  }, [chromeTabs, searchQuery]);

  const handleSelectAppWindow = (window: ActiveWindow) => {
    onAddWindow(taskId, {
      type: 'app',
      appName: window.appName,
      windowTitle: window.windowTitle,
    });
  };

  const handleSelectChromeTab = (tab: ActiveChromeTab) => {
    onAddWindow(taskId, {
      type: 'chrome-tab',
      tabUrl: tab.url,
      tabTitle: tab.title,
    });
  };

  return (
    <div className="window-editor" onClick={onClose}>
      <div className="window-editor-content" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2>ウィンドウを追加</h2>
          <button className="icon-btn" onClick={onClose} title="閉じる">
            <AiOutlineClose />
          </button>
        </div>

        {/* 検索ボックス */}
        <div className="search-box" style={{ marginBottom: 12 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            background: 'rgba(255, 255, 255, 0.1)', 
            borderRadius: 6,
            padding: '8px 12px',
            gap: 8
          }}>
            <AiOutlineSearch style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="ウィンドウ名を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: 13
              }}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <AiOutlineClose size={14} />
              </button>
            )}
          </div>
        </div>

        {/* タブ切り替え */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            className={`btn ${selectedTab === 'app' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedTab('app')}
          >
            <AiFillAppstore /> アプリ ({filteredWindows.length}/{activeWindows.length})
          </button>
          <button
            className={`btn ${selectedTab === 'chrome' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedTab('chrome')}
          >
            <AiFillChrome /> Chromeタブ ({filteredTabs.length}/{chromeTabs.length})
          </button>
        </div>

        {/* ウィンドウ一覧 */}
        <div className="window-list">
          {selectedTab === 'app' ? (
            filteredWindows.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 20 }}>
                {activeWindows.length === 0 
                  ? 'アプリウィンドウが見つかりません'
                  : '検索に一致するウィンドウがありません'}
              </div>
            ) : (
              filteredWindows.map((window, index) => (
                <div
                  key={index}
                  className="window-option"
                  onClick={() => handleSelectAppWindow(window)}
                >
                  <div className="window-option-app"><AiFillAppstore /> {window.appName}</div>
                  {window.windowTitle && (
                    <div className="window-option-title">{window.windowTitle}</div>
                  )}
                </div>
              ))
            )
          ) : (
            filteredTabs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 20 }}>
                {chromeTabs.length === 0 ? (
                  <>
                    Chromeタブが見つかりません<br />
                    <span style={{ fontSize: 11 }}>Chrome拡張機能が接続されていることを確認してください</span>
                  </>
                ) : (
                  '検索に一致するタブがありません'
                )}
              </div>
            ) : (
              filteredTabs.map((tab) => (
                <div
                  key={tab.tabId}
                  className="window-option"
                  onClick={() => handleSelectChromeTab(tab)}
                >
                  <div className="window-option-app"><AiFillChrome /> {tab.title}</div>
                  <div className="window-option-title">{tab.url}</div>
                </div>
              ))
            )
          )}
        </div>

        {/* <div className="editor-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            閉じる
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default WindowPicker;
