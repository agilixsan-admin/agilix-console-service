import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
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

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController extends BaseController {
  constructor(private readonly dashboardService: DashboardService) {
    super();
  }

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

  @Get('tenant-growth')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getTenantGrowth(@Query() query: DashboardPeriodQueryDto) {
    const result = await this.dashboardService.getTenantGrowth(query.months);
    return this.success(result, 'Tenant growth retrieved successfully');
  }

  @Get('revenue-summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.FINANCE_ADMIN)
  @HttpCode(HttpStatus.OK)
  async getRevenueSummary(@Query() query: DashboardPeriodQueryDto) {
    const result = await this.dashboardService.getRevenueSummary(query.months);
    return this.success(result, 'Revenue summary retrieved successfully');
  }
}
