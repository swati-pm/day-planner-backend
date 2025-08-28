export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination interfaces
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number;
  prevPage?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  maxLimit?: number;
}

export interface TaskFilters extends PaginationQuery {
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDateFrom?: string;
  dueDateTo?: string;
}


