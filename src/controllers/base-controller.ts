import { HttpStatus } from '@nestjs/common';
import { ApiResponse, PaginatedResult } from '../types/response.types';
export class BaseController {
  /**
   * Wraps a single resource in the standard success envelope.
   *
   * Usage:
   *   return this.success(user, 'User retrieved successfully');
   *
   * Produces:
   *   { success: true, message: 'User retrieved successfully', data: user }
   */
  protected success<T>(
    data: T,
    message = 'Operation successful',
  ): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
    };
  }

  /**
   * Wraps a paginated result set in the standard success envelope.
   *
   * The PaginatedResult shape is defined in API_SPEC.md § Pagination Standard:
   *   { items, total, page, limit, totalPages }
   *
   * Usage:
   *   return this.paginated(result, 'Users retrieved successfully');
   */
  protected paginated<T>(
    result: PaginatedResult<T>,
    message = 'Data retrieved successfully',
  ): ApiResponse<PaginatedResult<T>> {
    return {
      success: true,
      message,
      data: result,
    };
  }

  /**
   * Returns a success acknowledgement with no data payload.
   * Used for void operations such as deactivate, delete, logout.
   *
   * Usage:
   *   return this.noContent('User deactivated successfully');
   */
  protected noContent(message = 'Operation successful'): ApiResponse<void> {
    return {
      success: true,
      message,
    };
  }

  /**
   * Returns the standard HTTP status code for a created resource.
   * Convenience accessor — use with @HttpCode(this.CREATED) on POST handlers.
   */
  protected get CREATED(): HttpStatus {
    return HttpStatus.CREATED;
  }
}
