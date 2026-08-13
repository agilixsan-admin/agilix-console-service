import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { BaseController } from '../../base-controller';
import { AuditLogService } from '../../../service/modules/audit-logs/audit-log.service';
import { ListAuditLogsQueryDto } from '../../../dto/audit-log/list-audit-logs-query.dto';
import { JwtAuthGuard } from '../../../guards/jwt-auth.guard';
import { RolesGuard } from '../../../guards/roles.guard';
import { Roles } from '../../../decorators/roles.decorator';
import { UserRole } from '../../../types/enums/user-role.enum';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AuditLogController extends BaseController {
  constructor(private readonly auditLogService: AuditLogService) {
    super();
  }

  @ApiOperation({ summary: 'Get list audit logs dengan pagination dan filter' })
  @SwaggerResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: ListAuditLogsQueryDto) {
    const result = await this.auditLogService.findAll(query);
    return this.paginated(result, 'Audit logs retrieved successfully');
  }

  @ApiOperation({ summary: 'Get detail audit log by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @SwaggerResponse({
    status: 200,
    description: 'Audit log retrieved successfully',
  })
  @SwaggerResponse({ status: 401, description: 'Unauthorized' })
  @SwaggerResponse({ status: 403, description: 'Forbidden' })
  @SwaggerResponse({ status: 404, description: 'Audit log not found' })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    const log = await this.auditLogService.findById(id);
    return this.success(log, 'Audit log retrieved successfully');
  }
}
