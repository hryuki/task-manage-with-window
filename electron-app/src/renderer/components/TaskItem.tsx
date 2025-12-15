import React from 'react';
import { Task, TaskWindow } from '../../shared/types';

interface TaskItemProps {
  task: Task;
  windows: TaskWindow[];
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSwitch: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild: () => void;
  onPickWindows: () => void;
  onRemoveWindow: (windowId: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  windows,
  depth,
  hasChildren,
  isExpanded,
  onToggleExpand,
  onSwitch,
  onEdit,
  onDelete,
  onAddChild,
  onPickWindows,
  onRemoveWindow,
}) => {
  return (
    <div 
      className="task-item"
      style={{ marginLeft: depth * 16 }}
    >
      <div className="task-item-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasChildren && (
            <span 
              style={{ cursor: 'pointer', fontSize: 12 }}
              onClick={onToggleExpand}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span className="task-name">{task.name}</span>
        </div>
        <span className="task-windows-count">
          {windows.length} ウィンドウ
        </span>
      </div>

      {/* 紐づいたウィンドウ一覧 */}
      {windows.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
          {windows.map(win => (
            <div 
              key={win.id}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '4px 0'
              }}
            >
              <span>
                {win.type === 'app' 
                  ? `🖥 ${win.appName}${win.windowTitle ? ` - ${win.windowTitle}` : ''}`
                  : `🌐 ${win.tabTitle || win.tabUrl || 'Chrome タブ'}`
                }
              </span>
              <button
                className="task-action-btn"
                onClick={() => onRemoveWindow(win.id)}
                style={{ padding: '2px 6px', fontSize: 10 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* アクションボタン */}
      <div className="task-item-actions">
        <button className="task-action-btn switch" onClick={onSwitch}>
          切替
        </button>
        <button className="task-action-btn" onClick={onPickWindows}>
          +ウィンドウ
        </button>
        <button className="task-action-btn" onClick={onAddChild}>
          +子タスク
        </button>
        <button className="task-action-btn" onClick={onEdit}>
          編集
        </button>
        <button className="task-action-btn" onClick={onDelete}>
          削除
        </button>
      </div>
    </div>
  );
};

export default TaskItem;
