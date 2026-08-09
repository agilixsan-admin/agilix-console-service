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

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController extends BaseController {
  constructor(private readonly tenantService: TenantService) {
    super();
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.SUPPORT_ADMIN)
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: ListTenantsQueryDto) {
    const result = await this.tenantService.findAll(query);
    return this.paginated(result, 'Tenants retrieved successfully');
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN, UserRole.SUPPORT_ADMIN)
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const tenant = await this.tenantService.findById(id);
    return this.success(tenant, 'Tenant retrieved successfully');
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTenantDto, @CurrentUser() actor: User) {
    const tenant = await this.tenantService.create(dto, actor.id);
    return this.success(tenant, 'Tenant created successfully');
  }

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
