export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
export interface ApiResponse<T = void> {
  success: boolean;
  message: string;
  data?: T;
}
