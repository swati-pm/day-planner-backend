import { PaginationQuery, PaginationMeta, PaginationOptions, PaginatedResponse } from '../types';

/**
 * Default pagination settings
 */
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

/**
 * Normalizes pagination query parameters
 */
export function normalizePaginationQuery(query: PaginationQuery): PaginationOptions {
  const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
  const limit = Math.min(
    Math.max(1, Number(query.limit) || DEFAULT_LIMIT),
    MAX_LIMIT
  );
  
  return {
    page,
    limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder === 'desc' ? 'desc' : 'asc',
    maxLimit: MAX_LIMIT
  };
}

/**
 * Creates pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : undefined,
    prevPage: hasPrevPage ? page - 1 : undefined
  };
}

/**
 * Creates a paginated response
 */
export function createPaginatedResponse<T>(
  items: T[],
  pagination: PaginationOptions,
  total: number
): PaginatedResponse<T> {
  const meta = createPaginationMeta(pagination.page, pagination.limit, total);
  
  return {
    items,
    pagination: meta
  };
}

/**
 * Calculates SQL OFFSET for pagination
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Validates and parses sort parameters
 */
export function parseSortParams(
  sortBy?: string,
  sortOrder?: string,
  allowedSortFields: string[] = []
): { sortBy: string; sortOrder: 'asc' | 'desc' } {
  const validSortBy = allowedSortFields.length > 0 && sortBy && allowedSortFields.includes(sortBy)
    ? sortBy
    : allowedSortFields[0] || 'createdAt';
  
  const validSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';
  
  return {
    sortBy: validSortBy,
    sortOrder: validSortOrder
  };
}

/**
 * Creates SQL LIMIT and OFFSET clause
 */
export function createLimitOffsetClause(page: number, limit: number): string {
  const offset = calculateOffset(page, limit);
  return `LIMIT ${limit} OFFSET ${offset}`;
}

/**
 * Creates SQL ORDER BY clause
 */
export function createOrderByClause(
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  allowedFields: string[] = []
): string {
  const validSortBy = allowedFields.length > 0 && allowedFields.includes(sortBy)
    ? sortBy
    : allowedFields[0] || 'createdAt';
  
  return `ORDER BY ${validSortBy} ${sortOrder.toUpperCase()}`;
}
