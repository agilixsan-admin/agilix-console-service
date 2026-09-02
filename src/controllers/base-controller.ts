import { HttpStatus } from '@nestjs/common';
import { ApiResponse, PaginatedResult } from '../types/response.types';
export class BaseController {
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

  protected noContent(message = 'Operation successful'): ApiResponse<void> {
    return {
      success: true,
      message,
    };
  }

  protected get CREATED(): HttpStatus {
    return HttpStatus.CREATED;
  }
}
