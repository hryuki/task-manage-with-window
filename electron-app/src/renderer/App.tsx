import React, { useCallback, useEffect, useState } from 'react';
import { AiOutlineClose, AiOutlineSync } from "react-icons/ai";
import { ActiveChromeTab, ActiveWindow, Task, TaskWindow } from '../shared/types';
import TaskEditor from './components/TaskEditor';
import TaskList from './components/TaskList';
import WindowPicker from './components/WindowPicker';

// 階層構造を持つタスク
interface TaskWithChildren extends Task {
  children: TaskWithChildren[];
  windows: TaskWindow[];
}

function App() {
  const [tasks, setTasks] = useState<TaskWithChildren[]>([]);
  const [activeWindows, setActiveWindows] = useState<ActiveWindow[]>([]);
  const [chromeTabs, setChromeTabs] = useState<ActiveChromeTab[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [pickingWindowsForTask, setPickingWindowsForTask] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [chromeConnected, setChromeConnected] = useState(false);

  // タスクをツリー構造に変換
  const buildTaskTree = useCallback((flatTasks: Task[], taskWindows: TaskWindow[]): TaskWithChildren[] => {
    const taskMap = new Map<string, TaskWithChildren>();
    
    // 全タスクをマップに登録
    flatTasks.forEach(task => {
      taskMap.set(task.id, {
        ...task,
        children: [],
        windows: taskWindows.filter(tw => tw.taskId === task.id),
      });
    });
    
    // 親子関係を構築
    const rootTasks: TaskWithChildren[] = [];
    taskMap.forEach(task => {
      if (task.parentId && taskMap.has(task.parentId)) {
        taskMap.get(task.parentId)!.children.push(task);
      } else {
        rootTasks.push(task);
      }
    });
    
    // orderでソート
    const sortByOrder = (a: TaskWithChildren, b: TaskWithChildren) => a.order - b.order;
    rootTasks.sort(sortByOrder);
    taskMap.forEach(task => task.children.sort(sortByOrder));
    
    return rootTasks;
  }, []);

  // タスクを読み込み
  const loadTasks = useCallback(async () => {
    try {
      const flatTasks = await window.electronAPI.getTasks();
      
      // 全タスクのウィンドウを取得
      const allWindows: TaskWindow[] = [];
      for (const task of flatTasks) {
        const windows = await window.electronAPI.getTaskWindows(task.id);
        allWindows.push(...windows);
      }
      
      const tree = buildTaskTree(flatTasks, allWindows);
      setTasks(tree);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, [buildTaskTree]);

  // ウィンドウ情報を更新
  const refreshWindows = useCallback(async () => {
    try {
      const windows = await window.electronAPI.getActiveWindows();
      setActiveWindows(windows);
      
      const tabs = await window.electronAPI.getChromeTabs();
      setChromeTabs(tabs);
      setChromeConnected(tabs.length > 0);
    } catch (error) {
      console.error('Failed to refresh windows:', error);
    }
  }, []);

  // 初期読み込み
  useEffect(() => {
    loadTasks();
    refreshWindows();
    
    // 定期的にウィンドウ情報を更新
    const interval = setInterval(refreshWindows, 5000);
    return () => clearInterval(interval);
  }, [loadTasks, refreshWindows]);

  // タスク追加
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    
    try {
      await window.electronAPI.createTask(newTaskName.trim(), null);
      setNewTaskName('');
      await loadTasks();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  // 子タスク追加
  const handleAddChildTask = async (parentId: string, name: string) => {
    try {
      await window.electronAPI.createTask(name, parentId);
      await loadTasks();
    } catch (error) {
      console.error('Failed to create child task:', error);
    }
  };

  // タスク更新
  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await window.electronAPI.updateTask(id, updates);
      setEditingTask(null);
      await loadTasks();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  // タスク削除
  const handleDeleteTask = async (id: string) => {
    try {
      await window.electronAPI.deleteTask(id);
      await loadTasks();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  // タスク切り替え
  const handleSwitchToTask = async (taskId: string) => {
    try {
      await window.electronAPI.switchToTask(taskId);
    } catch (error) {
      console.error('Failed to switch to task:', error);
    }
  };

  // ウィンドウ追加
  const handleAddWindow = async (taskId: string, windowData: Omit<TaskWindow, 'id' | 'taskId'>) => {
    try {
      await window.electronAPI.addTaskWindow({ ...windowData, taskId });
      setPickingWindowsForTask(null);
      await loadTasks();
    } catch (error) {
      console.error('Failed to add window:', error);
    }
  };

  // ウィンドウ削除
  const handleRemoveWindow = async (windowId: string) => {
    try {
      await window.electronAPI.removeTaskWindow(windowId);
      await loadTasks();
    } catch (error) {
      console.error('Failed to remove window:', error);
    }
  };

  // ウィンドウを非表示
  const handleHideWindow = async () => {
    await window.electronAPI.hideWindow();
  };

  // タスク完了状態をトグル
  const handleToggleComplete = async (taskId: string) => {
    // タスクツリーから対象タスクを探す
    const findTask = (tasks: TaskWithChildren[]): TaskWithChildren | null => {
      for (const task of tasks) {
        if (task.id === taskId) return task;
        const found = findTask(task.children);
        if (found) return found;
      }
      return null;
    };
    
    const task = findTask(tasks);
    if (!task) return;
    
    try {
      await window.electronAPI.updateTask(taskId, { completed: !task.completed });
      await loadTasks();
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
    }
  };

  return (
    <div className="app-container">
      {/* ヘッダー */}
      <header className="header">
        <h1>Task Manager</h1>
        <div className="header-actions">
          <button 
            className="icon-btn" 
            onClick={refreshWindows}
            title="ウィンドウ情報を更新"
          >
            <AiOutlineSync />
          </button>
          <button 
            className="icon-btn" 
            onClick={handleHideWindow}
            title="ウィンドウを非表示"
          >
            <AiOutlineClose />
          </button>
        </div>
      </header>

      {/* タスク一覧 */}
      {tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-text">
            タスクがありません<br />
            下のフォームから追加してください
          </div>
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          onSwitchToTask={handleSwitchToTask}
          onEditTask={setEditingTask}
          onDeleteTask={handleDeleteTask}
          onAddChildTask={handleAddChildTask}
          onPickWindows={setPickingWindowsForTask}
          onRemoveWindow={handleRemoveWindow}
          onToggleComplete={handleToggleComplete}
        />
      )}

      {/* 新規タスク追加フォーム */}
      <form className="add-task-form" onSubmit={handleAddTask}>
        <input
          type="text"
          className="add-task-input"
          placeholder="新しいタスクを追加..."
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
        />
      </form>

      {/* ステータスバー */}
      <div className="status-bar">
        <span className={`status-dot ${chromeConnected ? '' : 'disconnected'}`}></span>
        <span>Chrome: {chromeConnected ? '接続中' : '未接続'}</span>
        <span style={{ marginLeft: 'auto' }}>
          {activeWindows.length} ウィンドウ / {chromeTabs.length} タブ
        </span>
      </div>

      {/* タスク編集モーダル */}
      {editingTask && (
        <TaskEditor
          task={editingTask}
          onSave={handleUpdateTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* ウィンドウ選択モーダル */}
      {pickingWindowsForTask && (
        <WindowPicker
          taskId={pickingWindowsForTask}
          activeWindows={activeWindows}
          chromeTabs={chromeTabs}
          onAddWindow={handleAddWindow}
          onClose={() => setPickingWindowsForTask(null)}
          onRefresh={refreshWindows}
        />
      )}
    </div>
  );
}

export default App;
