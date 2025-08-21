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
  validateQuery(taskFiltersSchema),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const filters = req.query as TaskFilters;
    const pagination = normalizePaginationQuery(filters);
    
    const [tasks, total] = await Promise.all([
      findAllTasks({ ...filters, ...pagination }),
      getTaskCount(filters)
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
  validateParams(Joi.object({ id: uuidSchema })),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    
    const task = await findTaskById(id);
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
  validate(createTaskSchema),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const task = await createTask(req.body);

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
  validateParams(Joi.object({ id: uuidSchema })),
  validate(updateTaskSchema),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    
    const task = await updateTask(id, req.body);
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
  validateParams(Joi.object({ id: uuidSchema })),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    
    const existingTask = await findTaskById(id);
    if (!existingTask) {
      throw createError('Task not found', 404);
    }

    const task = await updateTask(id, { completed: !existingTask.completed });

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
  validateParams(Joi.object({ id: uuidSchema })),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { id } = req.params;
    
    const deleted = await deleteTask(id);
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
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const [
      total,
      completed,
      pending,
      highPriority,
      overdue
    ] = await Promise.all([
      getTaskCount(),
      getTaskCount({ completed: true }),
      getTaskCount({ completed: false }),
      getTaskCount({ priority: 'high' }),
      getTaskCount({ 
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
