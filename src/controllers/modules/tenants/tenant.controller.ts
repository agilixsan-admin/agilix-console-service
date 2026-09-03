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
  ApiBody,
} from '@nestjs/swagger';
import { BaseController } from '../../base-controller';
import { TenantService } from '../../../service/modules/tenants/tenant.service';
import { CreateTenantDto } from '../../../dto/tenant/create-tenant.dto';
import { UpdateTenantDto } from '../../../dto/tenant/update-tenant.dto';
import { ListTenantsQueryDto } from '../../../dto/tenant/list-tenants-query.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { CurrentUser } from '../../../decorators/current-user.decorator';
import { User } from '../../../models/user.model';
import { UserRole } from '../../../types/enums/user-role.enum';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Tenants')
@ApiBearerAuth()
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController extends BaseController {
  constructor(private readonly tenantService: TenantService) {
    super();
  }

  @ApiOperation({ summary: 'Get list tenants dengan pagination dan filter' })
  @SwaggerResponse({
    status: 200,
    description: 'Tenants retrieved successfully',
  })
  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.SUPPORT_ADMIN,
    UserRole.VIEWER,
  )
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: ListTenantsQueryDto) {
    const result = await this.tenantService.findAll(query);
    return this.paginated(result, 'Tenants retrieved successfully');
  }

  @ApiOperation({ summary: 'Get detail tenant by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @SwaggerResponse({
    status: 200,
    description: 'Tenant retrieved successfully',
  })
  @SwaggerResponse({ status: 404, description: 'Tenant not found' })
  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.SUPPORT_ADMIN,
    UserRole.VIEWER,
  )
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const tenant = await this.tenantService.findById(id);
    return this.success(tenant, 'Tenant retrieved successfully');
  }

  @ApiOperation({ summary: 'Create tenant baru' })
  @ApiBody({ type: CreateTenantDto })
  @SwaggerResponse({ status: 201, description: 'Tenant created successfully' })
  @SwaggerResponse({ status: 409, description: 'Email already exists' })
  @SwaggerResponse({ status: 429, description: 'Too many requests' })
  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  @Throttle({ strict: { ttl: 60_000, limit: 5 } })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTenantDto, @CurrentUser() actor: User) {
    const tenant = await this.tenantService.create(dto, actor.id);
    return this.success(tenant, 'Tenant created successfully');
  }

  @ApiOperation({ summary: 'Update tenant' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiBody({ type: UpdateTenantDto })
  @SwaggerResponse({ status: 200, description: 'Tenant updated successfully' })
  @SwaggerResponse({ status: 404, description: 'Tenant not found' })
  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() actor: User,
  ) {
    const tenant = await this.tenantService.update(id, dto, actor.id);
    return this.success(tenant, 'Tenant updated successfully');
  }

  @ApiOperation({ summary: 'Lock tenant (suspend access)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Tenant locked successfully' })
  @SwaggerResponse({ status: 404, description: 'Tenant not found' })
  @SwaggerResponse({ status: 400, description: 'Tenant already locked' })
  @Patch(':id/lock')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  @HttpCode(HttpStatus.OK)
  async lock(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: User,
  ) {
    const tenant = await this.tenantService.lock(id, actor.id);
    return this.success(tenant, 'Tenant locked successfully');
  }

  @ApiOperation({ summary: 'Unlock tenant (restore access)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @SwaggerResponse({
    status: 200,
    description: 'Tenant unlocked successfully',
  })
  @SwaggerResponse({ status: 404, description: 'Tenant not found' })
  @SwaggerResponse({ status: 400, description: 'Tenant is not locked' })
  @Patch(':id/unlock')
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  @HttpCode(HttpStatus.OK)
  async unlock(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: User,
  ) {
    const tenant = await this.tenantService.unlock(id, actor.id);
    return this.success(tenant, 'Tenant unlocked successfully');
  }

  @ApiOperation({ summary: 'Soft delete tenant' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @SwaggerResponse({
    status: 200,
    description: 'Tenant deleted successfully',
  })
  @SwaggerResponse({ status: 404, description: 'Tenant not found' })
  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() actor: User,
  ) {
    await this.tenantService.remove(id, actor.id);
    return this.noContent('Tenant deleted successfully');
  }
}
