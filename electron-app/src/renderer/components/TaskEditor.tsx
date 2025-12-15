import React, { useState } from 'react';
import { Task } from '../../shared/types';

interface TaskEditorProps {
  task: Task;
  onSave: (id: string, updates: Partial<Task>) => void;
  onClose: () => void;
}

const TaskEditor: React.FC<TaskEditorProps> = ({ task, onSave, onClose }) => {
  const [name, setName] = useState(task.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(task.id, { name: name.trim() });
    }
  };

  return (
    <div className="window-editor" onClick={onClose}>
      <div className="window-editor-content" onClick={e => e.stopPropagation()}>
        <h2>タスクを編集</h2>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="add-task-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            style={{ marginBottom: 16 }}
          />
          
          <div className="editor-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              キャンセル
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskEditor;
