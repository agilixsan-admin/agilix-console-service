/**
 * PaginatedResult
 *
 * Standard paginated response contract used by all list endpoints.
 * Source of truth: API_SPEC.md → Pagination Standard
 *
 * Shape:
 * {
 *   items: T[],
 *   total: number,
 *   page: number,
 *   limit: number,
 *   totalPages: number
 * }
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * ApiResponse
 *
 * Standard single-resource response contract used by all non-list endpoints.
 * Source of truth: API_SPEC.md → Response Format
 *
 * Shape:
 * {
 *   success: boolean,
 *   message: string,
 *   data: T
 * }
 */
export interface ApiResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
}
