import { v4 as uuidv4 } from 'uuid';
import { runQuery, getRow, getAllRows } from '../database/init';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskFilters } from '../types';
import { calculateOffset, parseSortParams } from '../utils/pagination';

const mapRowToTask = (row: any): Task => {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    completed: Boolean(row.completed),
    priority: row.priority,
    dueDate: row.dueDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
};

export const createTask = async (taskData: CreateTaskRequest): Promise<Task> => {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const query = `
    INSERT INTO tasks (id, title, description, priority, dueDate, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    id,
    taskData.title,
    taskData.description || null,
    taskData.priority || 'medium',
    taskData.dueDate || null,
    now,
    now
  ];

  try {
    await runQuery(query, params);
    
    // Return the task object directly instead of querying again
    return {
      id,
      title: taskData.title,
      description: taskData.description,
      completed: false,
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate,
      createdAt: now,
      updatedAt: now
    };
  } catch (error) {
    throw error;
  }
};

export const findTaskById = async (id: string): Promise<Task | null> => {
  const query = 'SELECT * FROM tasks WHERE id = ?';
  const row = await getRow(query, [id]);
  
  if (!row) {
    return null;
  }
  
  return mapRowToTask(row);
};

export const findAllTasks = async (filters: TaskFilters = {}): Promise<Task[]> => {
  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params: any[] = [];

  // Apply filters
  if (filters.completed !== undefined) {
    query += ' AND completed = ?';
    params.push(filters.completed ? 1 : 0);
  }

  if (filters.priority) {
    query += ' AND priority = ?';
    params.push(filters.priority);
  }

  if (filters.dueDateFrom) {
    query += ' AND dueDate >= ?';
    params.push(filters.dueDateFrom);
  }

  if (filters.dueDateTo) {
    query += ' AND dueDate <= ?';
    params.push(filters.dueDateTo);
  }

  // Apply sorting
  const allowedSortFields = ['title', 'completed', 'priority', 'dueDate', 'createdAt', 'updatedAt'];
  const { sortBy, sortOrder } = parseSortParams(
    filters.sortBy, 
    filters.sortOrder, 
    allowedSortFields
  );
  query += ` ORDER BY ${sortBy} ${sortOrder}`;

  // Apply pagination
  if (filters.limit) {
    const offset = calculateOffset(filters.page || 1, filters.limit);
    query += ` LIMIT ${filters.limit} OFFSET ${offset}`;
  }

  const rows = await getAllRows(query, params);
  return rows.map(row => mapRowToTask(row));
};

export const updateTask = async (id: string, updateData: UpdateTaskRequest): Promise<Task | null> => {
  const existingTask = await findTaskById(id);
  if (!existingTask) {
    return null;
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (updateData.title !== undefined) {
    updates.push('title = ?');
    params.push(updateData.title);
  }

  if (updateData.description !== undefined) {
    updates.push('description = ?');
    params.push(updateData.description);
  }

  if (updateData.completed !== undefined) {
    updates.push('completed = ?');
    params.push(updateData.completed ? 1 : 0);
  }

  if (updateData.priority !== undefined) {
    updates.push('priority = ?');
    params.push(updateData.priority);
  }

  if (updateData.dueDate !== undefined) {
    updates.push('dueDate = ?');
    params.push(updateData.dueDate);
  }

  if (updates.length === 0) {
    return existingTask;
  }

  updates.push('updatedAt = ?');
  params.push(new Date().toISOString());
  params.push(id);

  const query = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`;
  await runQuery(query, params);

  return findTaskById(id);
};

export const deleteTask = async (id: string): Promise<boolean> => {
  const query = 'DELETE FROM tasks WHERE id = ?';
  const result = await runQuery(query, [id]);
  return (result.changes || 0) > 0;
};

export const getTaskCount = async (filters: Omit<TaskFilters, 'page' | 'limit' | 'sortBy' | 'sortOrder'> = {}): Promise<number> => {
  let query = 'SELECT COUNT(*) as count FROM tasks WHERE 1=1';
  const params: any[] = [];

  if (filters.completed !== undefined) {
    query += ' AND completed = ?';
    params.push(filters.completed ? 1 : 0);
  }

  if (filters.priority) {
    query += ' AND priority = ?';
    params.push(filters.priority);
  }

  if (filters.dueDateFrom) {
    query += ' AND dueDate >= ?';
    params.push(filters.dueDateFrom);
  }

  if (filters.dueDateTo) {
    query += ' AND dueDate <= ?';
    params.push(filters.dueDateTo);
  }

  const row = await getRow(query, params);
  return row?.count || 0;
};
