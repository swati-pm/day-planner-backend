import express from 'express';
import { 
  createTask, 
  findTaskById, 
  findAllTasks, 
  updateTask, 
  deleteTask, 
  getTaskCount 
} from '../models/Task';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { 
  validate, 
  validateQuery, 
  validateParams, 
  createTaskSchema, 
  updateTaskSchema, 
  taskFiltersSchema,
  uuidSchema 
} from '../utils/validation';
import { 
  normalizePaginationQuery, 
  createPaginatedResponse 
} from '../utils/pagination';
import { ApiResponse, Task, TaskFilters, PaginatedResponse } from '../types';
import Joi from 'joi';

const router = express.Router();

// GET /api/tasks - Get all tasks with filtering and pagination
router.get('/', 
  authenticateToken,
  validateQuery(taskFiltersSchema),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const filters = req.query as TaskFilters;
    const pagination = normalizePaginationQuery(filters);
    const userId = req.user!.id;
    
    const [tasks, total] = await Promise.all([
      findAllTasks(userId, { ...filters, ...pagination }),
      getTaskCount(userId, filters)
    ]);

    const paginatedData = createPaginatedResponse(tasks, pagination, total);

    const response: ApiResponse<PaginatedResponse<Task>> = {
      success: true,
      data: paginatedData
    };

    res.json(response);
  })
);

// GET /api/tasks/:id - Get task by ID
router.get('/:id', 
  authenticateToken,
  validateParams(Joi.object({ id: uuidSchema })),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const task = await findTaskById(id, userId);
    if (!task) {
      throw createError('Task not found', 404);
    }

    const response: ApiResponse<Task> = {
      success: true,
      data: task
    };

    res.json(response);
  })
);

// POST /api/tasks - Create new task
router.post('/', 
  authenticateToken,
  validate(createTaskSchema),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.id;
    const task = await createTask(userId, req.body);

    const response: ApiResponse<Task> = {
      success: true,
      data: task,
      message: 'Task created successfully'
    };

    res.status(201).json(response);
  })
);

// PUT /api/tasks/:id - Update task
router.put('/:id', 
  authenticateToken,
  validateParams(Joi.object({ id: uuidSchema })),
  validate(updateTaskSchema),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const task = await updateTask(id, userId, req.body);
    if (!task) {
      throw createError('Task not found', 404);
    }

    const response: ApiResponse<Task> = {
      success: true,
      data: task,
      message: 'Task updated successfully'
    };

    res.json(response);
  })
);

// PATCH /api/tasks/:id/toggle - Toggle task completion status
router.patch('/:id/toggle', 
  authenticateToken,
  validateParams(Joi.object({ id: uuidSchema })),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const existingTask = await findTaskById(id, userId);
    if (!existingTask) {
      throw createError('Task not found', 404);
    }

    const task = await updateTask(id, userId, { completed: !existingTask.completed });

    const response: ApiResponse<Task> = {
      success: true,
      data: task!,
      message: `Task marked as ${task!.completed ? 'completed' : 'incomplete'}`
    };

    res.json(response);
  })
);

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', 
  authenticateToken,
  validateParams(Joi.object({ id: uuidSchema })),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    
    const deleted = await deleteTask(id, userId);
    if (!deleted) {
      throw createError('Task not found', 404);
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Task deleted successfully'
    };

    res.json(response);
  })
);

// GET /api/tasks/stats/summary - Get task statistics
router.get('/stats/summary', 
  authenticateToken,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const userId = req.user!.id;
    
    const [
      total,
      completed,
      pending,
      highPriority,
      overdue
    ] = await Promise.all([
      getTaskCount(userId),
      getTaskCount(userId, { completed: true }),
      getTaskCount(userId, { completed: false }),
      getTaskCount(userId, { priority: 'high' }),
      getTaskCount(userId, { 
        completed: false, 
        dueDateTo: new Date().toISOString() 
      })
    ]);

    const response: ApiResponse<{
      total: number;
      completed: number;
      pending: number;
      highPriority: number;
      overdue: number;
    }> = {
      success: true,
      data: {
        total,
        completed,
        pending,
        highPriority,
        overdue
      }
    };

    res.json(response);
  })
);

export default router;
