import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BaseController } from '../../base-controller';
import { DashboardService } from '../../../service/modules/dashboard/dashboard.service';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { UserRole } from '../../../types/enums/user-role.enum';

class DashboardPeriodQueryDto {
  @IsInt()
  @Min(1)
  @Max(24)
  @IsOptional()
  months?: number;
}

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController extends BaseController {
  constructor(private readonly dashboardService: DashboardService) {
    super();
  }

  @ApiOperation({ summary: 'Get ringkasan data dashboard (tenant, invoice, device)' })
  @SwaggerResponse({ status: 200, description: 'Dashboard summary retrieved successfully' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
  @Get('summary')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.FINANCE_ADMIN,
    UserRole.SUPPORT_ADMIN,
    UserRole.VIEWER,
  )
  @HttpCode(HttpStatus.OK)
  async getSummary() {
    const result = await this.dashboardService.getSummary();
    return this.success(result, 'Dashboard summary retrieved successfully');
  }

  @ApiOperation({ summary: 'Get data pertumbuhan tenant per bulan' })
  @SwaggerResponse({ status: 200, description: 'Tenant growth retrieved successfully' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
  @Get('tenant-growth')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getTenantGrowth(@Query() query: DashboardPeriodQueryDto) {
    const result = await this.dashboardService.getTenantGrowth(query.months);
    return this.success(result, 'Tenant growth retrieved successfully');
  }

  @ApiOperation({ summary: 'Get ringkasan pendapatan per bulan' })
  @SwaggerResponse({ status: 200, description: 'Revenue summary retrieved successfully' })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
  @Get('revenue-summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getRevenueSummary(@Query() query: DashboardPeriodQueryDto) {
    const result = await this.dashboardService.getRevenueSummary(query.months);
    return this.success(result, 'Revenue summary retrieved successfully');
  }
}
