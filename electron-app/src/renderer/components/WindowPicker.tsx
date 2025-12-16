import React, { useState } from 'react';
import { AiFillAppstore, AiFillChrome, AiOutlineClose } from 'react-icons/ai';
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

        {/* タブ切り替え */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button
            className={`btn ${selectedTab === 'app' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedTab('app')}
          >
            <AiFillAppstore /> アプリ ({activeWindows.length})
          </button>
          <button
            className={`btn ${selectedTab === 'chrome' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedTab('chrome')}
          >
            <AiFillChrome /> Chromeタブ ({chromeTabs.length})
          </button>
        </div>

        {/* ウィンドウ一覧 */}
        <div className="window-list">
          {selectedTab === 'app' ? (
            activeWindows.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 20 }}>
                アプリウィンドウが見つかりません
              </div>
            ) : (
              activeWindows.map((window, index) => (
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
            chromeTabs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 20 }}>
                Chromeタブが見つかりません<br />
                <span style={{ fontSize: 11 }}>Chrome拡張機能が接続されていることを確認してください</span>
              </div>
            ) : (
              chromeTabs.map((tab) => (
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
