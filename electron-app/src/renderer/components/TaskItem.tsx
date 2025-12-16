import React from 'react';
import { AiFillAppstore, AiFillChrome, AiFillDelete, AiOutlineForm, AiOutlinePushpin, AiOutlineSwap } from 'react-icons/ai';
import { FaRegWindowRestore } from 'react-icons/fa';
import { TiFlowChildren } from 'react-icons/ti';
import { Task, TaskWindow } from '../../shared/types';

interface TaskItemProps {
  task: Task;
  windows: TaskWindow[];
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isPinned: boolean;
  onToggleExpand: () => void;
  onSwitch: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild: () => void;
  onPickWindows: () => void;
  onRemoveWindow: (windowId: string) => void;
  onToggleComplete: () => void;
  onTogglePin: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({
  task,
  windows,
  depth,
  hasChildren,
  isExpanded,
  isPinned,
  onToggleExpand,
  onSwitch,
  onEdit,
  onDelete,
  onAddChild,
  onPickWindows,
  onRemoveWindow,
  onToggleComplete,
  onTogglePin,
}) => {
  return (
    <div 
      className={`task-item task-item-compact ${isPinned ? 'task-item-pinned' : ''}`}
      style={{ marginLeft: depth * 12 }}
    >
      {/* メイン行: タスク名のみ */}
      <div className="task-item-header">
        <div className="task-item-left">
          {hasChildren && (
            <span 
              className="expand-toggle"
              onClick={onToggleExpand}
            >
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <input
            type="checkbox"
            className="task-checkbox"
            checked={task.completed}
            onChange={onToggleComplete}
          />
          <span 
            className="task-name"
            style={{
              textDecoration: task.completed ? 'line-through' : 'none',
              opacity: task.completed ? 0.5 : 1,
              color: task.completed ? 'var(--text-secondary)' : 'inherit',
            }}
          >
            {task.name}
          </span>
        </div>
        {/* ウィンドウ切り替えボタン（ウィンドウがある場合のみ表示） */}
        {windows.length > 0 && (
          <button 
            className="task-action-btn" 
            onClick={onSwitch}
            title="ウィンドウに切り替え"
          >
            <AiOutlineSwap />
          </button>
        )}
      </div>

      {/* ホバー時に展開するエリア（アクションボタン + ウィンドウ一覧） */}
      <div className="task-expandable-area">
        {/* アクションボタン */}
        <div className="task-item-actions">
          {/* <button className="task-action-btn switch" onClick={onSwitch} title="切り替え">
            <AiOutlineSwap />
          </button> */}
          <button 
            className={`task-action-btn ${isPinned ? 'pinned' : ''}`} 
            onClick={onTogglePin} 
            title={isPinned ? 'ピン留め解除' : 'ピン留め'}
          >
            <AiOutlinePushpin />
          </button>
          <button className="task-action-btn" onClick={onPickWindows} title="ウィンドウ追加">
            <FaRegWindowRestore />
          </button>
          <button className="task-action-btn" onClick={onAddChild} title="子タスク追加">
            <TiFlowChildren />
          </button>
          <button className="task-action-btn" onClick={onEdit} title="編集">
            <AiOutlineForm />
          </button>
          <button className="task-action-btn" onClick={onDelete} title="削除">
            <AiFillDelete />
          </button>
        </div>

        {/* 紐づいたウィンドウ一覧 */}
        {windows.length > 0 && (
          <div className="task-windows-list">
            {windows.map(win => (
              <div 
                key={win.id}
                className="task-window-item"
              >
                <span className="task-window-info">
                  {win.type === 'app' 
                    ? <><AiFillAppstore /> {win.appName}{win.windowTitle ? ` - ${win.windowTitle}` : ''}</>
                    : <><AiFillChrome /> {win.tabTitle || win.tabUrl || 'Chrome タブ'}</>
                  }
                </span>
                <button
                  className="task-action-btn task-window-remove"
                  onClick={() => onRemoveWindow(win.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
