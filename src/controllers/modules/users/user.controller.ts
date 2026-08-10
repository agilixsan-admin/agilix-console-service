import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { BaseController } from '../../base-controller';
import { UserService } from '../../../service/modules/users/user.service';
import { CreateUserDto } from '../../../dto/user/create-user.dto';
import { UpdateUserDto } from '../../../dto/user/update-user.dto';
import { ListUsersQueryDto } from '../../../dto/user/list-users-query.dto';
import { ApiResponse, PaginatedResult } from '../../../types/response.types';
import { User } from '../../../models/user.model';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { CurrentUser } from '../../../decorators/current-user.decorator';
import { UserRole } from '../../../types/enums/user-role.enum';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class UserController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }

  @ApiOperation({ summary: 'Get list users dengan pagination dan filter' })
  @SwaggerResponse({ status: 200, description: 'Users retrieved successfully' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: ListUsersQueryDto,
  ): Promise<ApiResponse<PaginatedResult<User>>> {
    const result = await this.userService.findAll(query);
    return this.paginated(result, 'Users retrieved successfully');
  }

  @ApiOperation({ summary: 'Get detail user by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'User retrieved successfully' })
  @SwaggerResponse({ status: 404, description: 'User not found' })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<ApiResponse<User>> {
    const user = await this.userService.findById(id);
    return this.success(user, 'User retrieved successfully');
  }

  @ApiOperation({ summary: 'Create user baru' })
  @ApiBody({ type: CreateUserDto })
  @SwaggerResponse({ status: 201, description: 'User created successfully' })
  @SwaggerResponse({ status: 409, description: 'Email already exists' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() actor: User,
  ): Promise<ApiResponse<User>> {
    const user = await this.userService.create(dto, actor.id);
    return this.success(user, 'User created successfully');
  }

  @ApiOperation({ summary: 'Update user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateUserDto })
  @SwaggerResponse({ status: 200, description: 'User updated successfully' })
  @SwaggerResponse({ status: 404, description: 'User not found' })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: User,
  ): Promise<ApiResponse<User>> {
    const user = await this.userService.update(id, dto, actor.id);
    return this.success(user, 'User updated successfully');
  }

  @ApiOperation({ summary: 'Deactivate user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @SwaggerResponse({
    status: 200,
    description: 'User deactivated successfully',
  })
  @SwaggerResponse({ status: 404, description: 'User not found' })
  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivate(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: User,
  ): Promise<ApiResponse<User>> {
    const user = await this.userService.deactivate(id, actor.id);
    return this.success(user, 'User deactivated successfully');
  }

  @ApiOperation({ summary: 'Soft delete user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'User deleted successfully' })
  @SwaggerResponse({ status: 404, description: 'User not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: User,
  ): Promise<ApiResponse<void>> {
    await this.userService.remove(id, actor.id);
    return this.noContent('User deleted successfully');
  }
}
