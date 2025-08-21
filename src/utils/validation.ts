import Joi from 'joi';

// Task validation schemas
export const createTaskSchema = Joi.object({
  title: Joi.string().required().min(1).max(255),
  description: Joi.string().allow('').max(1000),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  dueDate: Joi.string().isoDate().allow(null)
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(255),
  description: Joi.string().allow('').max(1000),
  completed: Joi.boolean(),
  priority: Joi.string().valid('low', 'medium', 'high'),
  dueDate: Joi.string().isoDate().allow(null)
}).min(1);

// Query validation schemas
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

export const taskFiltersSchema = paginationSchema.keys({
  completed: Joi.boolean(),
  priority: Joi.string().valid('low', 'medium', 'high'),
  dueDateFrom: Joi.string().isoDate(),
  dueDateTo: Joi.string().isoDate()
});

// UUID validation schema
export const uuidSchema = Joi.string().uuid().required();

// Middleware for validation
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.details[0].message
      });
    }
    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Query validation error',
        message: error.details[0].message
      });
    }
    req.query = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Parameter validation error',
        message: error.details[0].message
      });
    }
    req.params = value;
    next();
  };
};
