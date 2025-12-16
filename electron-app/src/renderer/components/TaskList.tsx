import React, { useState } from 'react';
import { Task, TaskWindow } from '../../shared/types';
import TaskItem from './TaskItem';

interface TaskWithChildren extends Task {
  children: TaskWithChildren[];
  windows: TaskWindow[];
}

interface TaskListProps {
  tasks: TaskWithChildren[];
  pinnedTaskId: string | null;
  onSwitchToTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddChildTask: (parentId: string, name: string) => void;
  onPickWindows: (taskId: string) => void;
  onRemoveWindow: (windowId: string) => void;
  onToggleComplete: (taskId: string) => void;
  onTogglePin: (taskId: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  pinnedTaskId,
  onSwitchToTask,
  onEditTask,
  onDeleteTask,
  onAddChildTask,
  onPickWindows,
  onRemoveWindow,
  onToggleComplete,
  onTogglePin,
}) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [addingChildTo, setAddingChildTo] = useState<string | null>(null);
  const [newChildName, setNewChildName] = useState('');

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleAddChild = (parentId: string) => {
    if (!newChildName.trim()) return;
    onAddChildTask(parentId, newChildName.trim());
    setNewChildName('');
    setAddingChildTo(null);
  };

  const renderTask = (task: TaskWithChildren, depth: number = 0) => {
    const isExpanded = expandedTasks.has(task.id);
    const hasChildren = task.children.length > 0;

    return (
      <div key={task.id}>
        <TaskItem
          task={task}
          windows={task.windows}
          depth={depth}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          isPinned={pinnedTaskId === task.id}
          onToggleExpand={() => toggleExpanded(task.id)}
          onSwitch={() => onSwitchToTask(task.id)}
          onEdit={() => onEditTask(task)}
          onDelete={() => onDeleteTask(task.id)}
          onAddChild={() => setAddingChildTo(task.id)}
          onPickWindows={() => onPickWindows(task.id)}
          onRemoveWindow={onRemoveWindow}
          onToggleComplete={() => onToggleComplete(task.id)}
          onTogglePin={() => onTogglePin(task.id)}
        />

        {/* 子タスク追加フォーム */}
        {addingChildTo === task.id && (
          <div style={{ marginLeft: (depth + 1) * 16 + 12, marginBottom: 8 }}>
            <input
              type="text"
              className="add-task-input"
              placeholder="サブタスク名..."
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddChild(task.id);
                if (e.key === 'Escape') setAddingChildTo(null);
              }}
              autoFocus
            />
          </div>
        )}

        {/* 子タスク */}
        {hasChildren && isExpanded && (
          <div className="child-tasks">
            {task.children.map(child => renderTask(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="task-list">
      {tasks.map(task => renderTask(task))}
    </div>
  );
};

export default TaskList;
