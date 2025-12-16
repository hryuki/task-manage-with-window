import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Task, TaskWindow } from '../shared/types';

let db: Database.Database | null = null;

// データベースパス（ユーザーデータディレクトリに保存）
function getDbPath(): string {
  return join(app.getPath('userData'), 'tasks.db');
}

export function initDatabase() {
  const dbPath = getDbPath();
  db = new Database(dbPath);

  // テーブル作成
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parentId TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (parentId) REFERENCES tasks(id) ON DELETE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS task_windows (
      id TEXT PRIMARY KEY,
      taskId TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('app', 'chrome-tab')),
      appName TEXT,
      windowTitle TEXT,
      tabUrl TEXT,
      tabTitle TEXT,
      FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_tasks_parentId ON tasks(parentId);
    CREATE INDEX IF NOT EXISTS idx_task_windows_taskId ON task_windows(taskId);
  `);

  // マイグレーション: 既存テーブルにcompletedカラムがない場合は追加
  try {
    const tableInfo = db.prepare("PRAGMA table_info(tasks)").all() as Array<{ name: string }>;
    const hasCompleted = tableInfo.some(col => col.name === 'completed');
    if (!hasCompleted) {
      db.exec('ALTER TABLE tasks ADD COLUMN completed INTEGER NOT NULL DEFAULT 0');
      console.log('Migration: Added completed column to tasks table');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }

  console.log('Database initialized at:', dbPath);
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

// === タスク操作 ===

export function getAllTasks(): Task[] {
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare(`
    SELECT id, name, parentId, "order", completed, createdAt, updatedAt
    FROM tasks
    ORDER BY "order" ASC
  `);

  // SQLiteのINTEGERをbooleanに変換
  const rows = stmt.all() as Array<Omit<Task, 'completed'> & { completed: number }>;
  return rows.map(row => ({
    ...row,
    completed: row.completed === 1,
  }));
}

export function createTask(name: string, parentId: string | null = null): Task {
  if (!db) throw new Error('Database not initialized');

  const now = new Date().toISOString();
  const id = uuidv4();

  // 同階層の最大orderを取得
  const maxOrderStmt = db.prepare(`
    SELECT COALESCE(MAX("order"), -1) as maxOrder
    FROM tasks
    WHERE parentId IS ?
  `);
  const { maxOrder } = maxOrderStmt.get(parentId) as { maxOrder: number };

  const stmt = db.prepare(`
    INSERT INTO tasks (id, name, parentId, "order", completed, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, name, parentId, maxOrder + 1, 0, now, now);

  return {
    id,
    name,
    parentId,
    order: maxOrder + 1,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateTask(id: string, updates: Partial<Pick<Task, 'name' | 'parentId' | 'order' | 'completed'>>): Task | null {
  if (!db) throw new Error('Database not initialized');

  const now = new Date().toISOString();
  const sets: string[] = ['updatedAt = ?'];
  const values: (string | number | null | boolean)[] = [now];

  if (updates.name !== undefined) {
    sets.push('name = ?');
    values.push(updates.name);
  }
  if (updates.parentId !== undefined) {
    sets.push('parentId = ?');
    values.push(updates.parentId);
  }
  if (updates.order !== undefined) {
    sets.push('"order" = ?');
    values.push(updates.order);
  }
  if (updates.completed !== undefined) {
    sets.push('completed = ?');
    values.push(updates.completed ? 1 : 0);
  }

  values.push(id);

  const stmt = db.prepare(`
    UPDATE tasks
    SET ${sets.join(', ')}
    WHERE id = ?
  `);

  const result = stmt.run(...values);

  if (result.changes === 0) return null;

  // SQLiteのINTEGERをbooleanに変換
  const getStmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  const row = getStmt.get(id) as Omit<Task, 'completed'> & { completed: number };
  return {
    ...row,
    completed: row.completed === 1,
  };
}

export function deleteTask(id: string): boolean {
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  const result = stmt.run(id);

  return result.changes > 0;
}

// === タスクウィンドウ操作 ===

export function getTaskWindows(taskId: string): TaskWindow[] {
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare(`
    SELECT id, taskId, type, appName, windowTitle, tabUrl, tabTitle
    FROM task_windows
    WHERE taskId = ?
  `);

  return stmt.all(taskId) as TaskWindow[];
}

export function getAllTaskWindows(): TaskWindow[] {
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare(`
    SELECT id, taskId, type, appName, windowTitle, tabUrl, tabTitle
    FROM task_windows
  `);

  return stmt.all() as TaskWindow[];
}

export function addTaskWindow(taskWindow: Omit<TaskWindow, 'id'>): TaskWindow {
  if (!db) throw new Error('Database not initialized');

  const id = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO task_windows (id, taskId, type, appName, windowTitle, tabUrl, tabTitle)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    taskWindow.taskId,
    taskWindow.type,
    taskWindow.appName || null,
    taskWindow.windowTitle || null,
    taskWindow.tabUrl || null,
    taskWindow.tabTitle || null
  );

  return { id, ...taskWindow };
}

export function removeTaskWindow(id: string): boolean {
  if (!db) throw new Error('Database not initialized');

  const stmt = db.prepare('DELETE FROM task_windows WHERE id = ?');
  const result = stmt.run(id);

  return result.changes > 0;
}
